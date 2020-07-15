import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { TrtlApp, ServiceError } from 'trtl-apps';
import { Application } from 'probot'
import Webhooks from '@octokit/webhooks';
import { TipCommandInfo, Transaction } from '../types';
import { AppError } from '../appError';
import * as db from '../database';

const frontendUrl = functions.config().frontend.url;

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
  const [sendingUser] = await db.getAppUserByGithubId(tipCommand.senderGithubId);

  if (!sendingUser) {
    return `@${tipCommand.senderUsername} you don't have a tips account set up yet! Visit ${frontendUrl} to get started.`;
  }

  if (!sendingUser.githubId) {
    return `@${tipCommand.senderUsername} you don't have a tips account set up yet! Visit ${frontendUrl} to get started.`;
  }

  const [recipientGithubId, userError] = await db.getGithubIdByUsername(tipCommand.recipientUsername);

  if (!recipientGithubId) {
    console.log((userError as AppError).message);
    return `Unable to find github user: ${tipCommand.recipientUsername}`;
  }

  const [senderAccount, senderAccError] = await db.getTurtleAccount(tipCommand.senderGithubId);

  if (!senderAccount) {
    console.log((senderAccError as AppError).message);
    return `@${tipCommand.senderUsername} you don't have a tips account set up yet! Visit ${frontendUrl} to get started.`;
  }

  const [appConfig, configError] = await db.getAppConfig();

  if (!appConfig) {
    console.log((configError as AppError).message);
    return 'An error occurred, please try again later.';
  }

  const [recipientAccount, recipientAccError] = await db.getTurtleAccount(recipientGithubId);
  let isUnclaimed = false;
  let recipientAccountId: string | undefined;

  if (!recipientAccount) {
    isUnclaimed = true;
    const [recipientGithubUser, createError] = await db.createGithubUser(recipientGithubId);

    if (recipientGithubUser) {
      recipientAccountId = recipientGithubUser.accountId;
    } else {
      console.log((createError as AppError).message);
    }
  } else {
    recipientAccountId = recipientAccount.id;
  }

  if (!recipientAccountId) {
    console.log((recipientAccError as AppError).message);
    return `Failed to get tips account for user ${tipCommand.recipientUsername}.`;
  }

  const [transfer, transferError] = await TrtlApp.transfer(senderAccount.id, recipientAccountId, tipCommand.amount);

  if (!transfer) {
    return (transferError as ServiceError).message;
  }

  const senderTxRef = admin.firestore().collection(`accounts/${senderAccount.id}/transactions`).doc();
  const recipientTxRef = admin.firestore().collection(`accounts/${recipientAccountId}/transactions`).doc();

  const senderTx: Transaction = {
    id:                 senderTxRef.id,
    userId:             sendingUser.uid,
    accountId:          senderAccount.id,
    githubId:           sendingUser.githubId,
    timestamp:          transfer.timestamp,
    transferType:       'tip',
    amount:             tipCommand.amount,
    fee:                0,
    status:             'completed',
    accountTransferId:  transfer.id,
    senderUsername:     tipCommand.senderUsername,
    recipientUsername:  tipCommand.recipientUsername
  }

  const recipientTx: Transaction = {
    id:                 recipientTxRef.id,
    userId:             sendingUser.uid,
    accountId:          senderAccount.id,
    githubId:           sendingUser.githubId,
    timestamp:          transfer.timestamp,
    transferType:       'tip',
    amount:             tipCommand.amount,
    fee:                0,
    status:             'completed',
    accountTransferId:  transfer.id,
    senderUsername:     tipCommand.senderUsername,
    recipientUsername:  tipCommand.recipientUsername
  }

  await Promise.all([
    senderTxRef.set(senderTx),
    recipientTxRef.set(recipientTx),
    db.refreshAccount(senderAccount.id),
    db.refreshAccount(recipientAccountId)
  ]);

  let response = `\`${(tipCommand.amount / 100).toFixed(2)} TRTL\` successfully sent to @${tipCommand.recipientUsername}! Visit ${frontendUrl} to manage your tips.`;

  if (isUnclaimed && appConfig.tipTimeoutDays > 0) {
    const [unclaimedTip, tipError] = await db.createUnclaimedTipDoc(
                                      transfer,
                                      appConfig.tipTimeoutDays,
                                      tipCommand.senderUsername,
                                      tipCommand.recipientUsername,
                                      recipientGithubId);

    if (!unclaimedTip) {
      console.log((tipError as AppError).message);
    } else {
      response += `\n\n @${tipCommand.recipientUsername} you have not linked a tips account yet, visit ${frontendUrl} to activate your tips account. You have ${unclaimedTip.timeoutDays} days to claim your tip before @${sendingUser} is refunded!`;
    }
  }

  return response;
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
    recipientUsername: mentions[0],
    amount: amount
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
