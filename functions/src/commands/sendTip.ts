import { TrtlApp, ServiceError } from 'trtl-apps';
import { Application } from 'probot'
import Webhooks from '@octokit/webhooks';
import { TipCommandInfo } from '../types';
import { AppError } from '../appError';
import { getGithubIdByUsername, getAppUserByGithubId, getTurtleAccount } from '../backend';

export function initListeners(bot: Application) {
  bot.on('issue_comment.created', async context => {
    if (context.payload.action !== 'created') {
      return;
    }

    const commentText = context.payload.comment.body

    if (!commentText.startsWith('.tip ')) {
      return;
    }

    const senderId = context.payload.sender.id;
    const senderLogin = context.payload.sender.login;

    console.log(`comment created by: ${senderLogin}, id: ${senderId}`);

    const tipInfo = getTipCommandInfo(context.payload.comment);

    if (!tipInfo) {
      console.log('invalid tip command.');
      const params = context.issue({ body: 'Invalid tip command.' });
      await context.github.issues.createComment(params);

      return;
    }

    console.log(`process tip command: ${JSON.stringify(tipInfo)}`);

    const resultMessage = await proccessTipCommand(tipInfo);
    const resultParams = context.issue({ body: resultMessage });

    await context.github.issues.createComment(resultParams);
  });
}

async function proccessTipCommand(tipCommand: TipCommandInfo): Promise<string> {
  if (tipCommand.recipientNames.length < 1) {
    return `no tip recipients specified.`;
  }

  const [sendingUser] = await getAppUserByGithubId(tipCommand.senderGithubId);

  if (!sendingUser) {
    return `@${tipCommand.senderUsername} you don't have a tips account set up yet! Visit [comming soon] to get started.`;
  }

  if (!sendingUser.githubId) {
    return `@${tipCommand.senderUsername} you don't have a tips account set up yet! Visit [comming soon] to get started.`;
  }

  const recipientUsername = tipCommand.recipientNames[0];
  const [recipientGithubId, userError] = await getGithubIdByUsername(recipientUsername);

  if (!recipientGithubId) {
    console.log((userError as AppError).message);
    return `Unable to find github user: ${recipientUsername}`;
  }

  const [senderAccount, senderAccError] = await getTurtleAccount(tipCommand.senderGithubId, false);

  if (!senderAccount) {
    console.log((senderAccError as AppError).message);
    return `@${tipCommand.senderUsername} you don't have a tips account set up yet! Visit [comming soon] to get started.`;
  }

  const [recipientAccount, recipientAccError] = await getTurtleAccount(recipientGithubId, true);

  if (!recipientAccount) {
    console.log((recipientAccError as AppError).message);
    return `Failed to get tips account for user ${recipientUsername}.`;
  }

  const [transfer, transferError] = await TrtlApp.transfer(senderAccount.id, recipientAccount.id, tipCommand.amount);

  if (!transfer) {
    return (transferError as ServiceError).message;
  }

  // TODO: if recipient doesn't have an app user account yet, respond with an appropriate message.

  return `\`${(tipCommand.amount / 100).toFixed(2)} TRTL\` successfully sent to @${recipientUsername}! Visit [comming soon] to manage your tips.`;
}

function getTipCommandInfo(comment: Webhooks.WebhookPayloadIssueCommentComment): TipCommandInfo | undefined {
  const mentions = getMentions(comment.body);

  if (mentions.length === 0) {
    return undefined;
  }

  const amount = getTipAmount(comment.body);

  if (!amount) {
    return undefined;
  }

  const tipInfo: TipCommandInfo = {
    senderUsername: comment.user.login,
    senderGithubId: comment.user.id,
    recipientNames: mentions,
    amount:         amount
  };

  return tipInfo;
}

function getTipAmount(text: string): number | undefined {
  const words = text.split(' ');

  if (words.length < 2) {
    return undefined;
  }

  // get 2nd word in text
  const amount = parseFloat(words[1]);

  if (amount === NaN) {
    return undefined;
  }

  // convert to atomic units
  return amount * 100;
}

function getMentions(text: string): string[] {
  const mentionPattern = /\B@[a-z0-9_-]+/gi;
  const mentionsList = text.match(mentionPattern);

  if (!mentionsList) {
    return [];
  }

  return mentionsList.map((user: any) => user.substring(1));
}
