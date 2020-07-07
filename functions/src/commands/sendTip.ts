import * as admin from 'firebase-admin';
import { TrtlApp, Account, ServiceError } from 'trtl-apps';
import { Application } from 'probot'
import Webhooks from '@octokit/webhooks';
import { AppUser, TipCommandInfo } from '../types';
import { AppError } from '../appError';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({});

export function initListeners(bot: Application) {
  bot.on('issue_comment.created', async context => {
    if (context.payload.action !== 'created') {
      return;
    }

    // check for tip command in comment body
    const commentText = context.payload.comment.body

    if (!commentText.startsWith('.tip ')) {
      return;
    }

    const senderId = context.payload.sender.id;
    const sendedLogin = context.payload.sender.login;
    const senderUrl = context.payload.sender.url;

    console.log(`comment created by: ${sendedLogin}, id: ${senderId}, sender url: ${senderUrl}`);

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

async function proccessTipCommand(
  tipCommand: TipCommandInfo
): Promise<string> {
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
    return `@${tipCommand.senderUsername} you don't have a tips account set up yet!`;
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

  return `\`${(tipCommand.amount / 100).toFixed(2)} TRTL\` successfully sent to @${recipientUsername}! Visit [comming soon] to manage your tips.`;
}

async function getGithubIdByUsername(username: string): Promise<[number | undefined, undefined | AppError]> {
  try {
    const response = await octokit.users.getByUsername({
      username: username
    });

    return [response.data.id, undefined];
  } catch (error) {
    console.log(error);
    return [undefined, new AppError('github/user-not-found', error)];
  }
}

async function getAppUserByGithubId(githubId: number): Promise<[AppUser | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().collection(`users`)
                    .where('githubId', '==', githubId)
                    .get();

  if (snapshot.size !== 1) {
    return [undefined, new AppError('app/user-no-account')];
}

  return [snapshot.docs[0].data() as AppUser, undefined];
}

async function getTurtleAccount(
  githubId: number,
  autoCreate: boolean = false
): Promise<[Account | undefined, undefined | AppError]> {
  const accountDoc = await admin.firestore().doc(`accounts/${githubId}`).get();

  if (accountDoc.exists) {
    return [accountDoc.data() as Account, undefined];
  }

  if (autoCreate) {
    return await createTurtleAccount(githubId);
  } else {
    return [undefined, new AppError('app/user-no-account')];
  }
}

async function createTurtleAccount(githubId: number): Promise<[Account | undefined, undefined | AppError]> {
  const [account, accError] = await TrtlApp.createAccount();

  if (!account) {
    return [undefined, new AppError('app/create-account', accError?.message)];
  }

  try {
    await admin.firestore().doc(`accounts/${githubId}`).create(account);
    return [account, undefined];
  } catch (error) {
    return [undefined, new AppError('app/create-account')];
  }
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
    amount: amount,
    recipientNames: mentions
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
