import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as crypto from 'crypto';
import * as db from './database';
import * as SendTipCommand from './commands/sendTip';
import { Request, Response } from 'express';
import { TrtlApp, ServiceError, WithdrawalPreview, Withdrawal } from 'trtl-apps';
import { createProbot, Options } from 'probot'
import { UnclaimedTip, AppUser } from './types';
import groupBy from 'lodash.groupby';
import { AppError } from './appError';

const probotConfig = functions.config().probot;
const turtleConfig = functions.config().trtl;

// Init Firebase
admin.initializeApp();

// Init TRTL App
TrtlApp.initialize(turtleConfig.app_id, turtleConfig.app_secret);

const probotOptions: Options = {
  id:     probotConfig.app_id,
  secret: probotConfig.webhook_secret,
  cert:   probotConfig.private_key.replace(/\\n/g, '\n'),
}

const bot = createProbot(probotOptions);

bot.load(robot => {
  SendTipCommand.initListeners(robot);
});

/**
 * Relay Github events to the bot
 */
exports.bot = functions.https.onRequest(async (request: Request, response: Response) => {
  const name = request.get('x-github-event') || request.get('X-GitHub-Event');
  const id = request.get('x-github-delivery') || request.get('X-GitHub-Delivery');

  if(name && id) {
    try {
      await bot.receive({
        name,
        id,
        payload: request.body,
        protocol: 'https',
        host: request.hostname,
        url: request.url
      });
      response.send({
        statusCode: 200,
        body: JSON.stringify({
          message: 'Executed'
        })
      });
    } catch(err) {
      console.error(err);
      response.sendStatus(500);
    }
  } else {
    console.error(request);
    response.sendStatus(400);
  }
});

exports.onNewAuthUserCreated = functions.auth.user().onCreate(async (user) => {
  console.log(`creating new user => uid: ${user.uid}`);
  console.log(`user provider data: ${JSON.stringify(user.providerData)}`);

  const appUser: AppUser = {
    uid: user.uid
  }

  // TODO: get githubId from providers or API call

  await admin.firestore().doc(`users/${appUser.uid}`).set(appUser);

  if (appUser.githubId) {
    let [account, accountError] = await db.getTurtleAccount(appUser.githubId);

    if (account) {
      const tips = await db.getExpiredTips(appUser.githubId);

      if (tips.length > 0) {
        await db.deleteUnclaimedTips(tips.map(t => t.id));
      }
    } else {
      [account, accountError] = await db.createTurtleAccount(appUser.githubId);

      if (!account) {
        console.log(`error creating account for app user [${appUser.uid}]: ${(accountError as AppError).message}`);
      }
    }
  }
});

export const userPrepareWithdrawal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
  }

  const userId: string | undefined    = context.auth.uid;
  const amount: number | undefined    = data.amount;
  const address: string | undefined   = data.address;

  if (!userId || !amount || !address) {
    throw new functions.https.HttpsError('invalid-argument', 'invalid parameters provided.');
  }

  const [preparedTx, error] = await prepareWithdrawToAddress(userId, amount, address);

  if (!preparedTx) {
    throw new functions.https.HttpsError('internal', (error as AppError).message);
  }

  return preparedTx;
});

export const userWithdraw = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'Authenticattion error.');
  }

  const userId: string = context.auth.uid;
  const preparedWithdrawalId: string | undefined = data.preparedTxId;

  if (!preparedWithdrawalId) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid prepared withdrawal ID.');
  }

  const preparedWithdrawal = await db.getPreparedWithdrawal(userId, preparedWithdrawalId);

  if (!preparedWithdrawal) {
    throw new functions.https.HttpsError('not-found', 'Prepared withdrawal not found.');
  }

  const [withdrawal, error] = await sendPreparedWithdrawal(preparedWithdrawal);

  if (withdrawal) {
    return withdrawal;
  } else {
    throw new functions.https.HttpsError('aborted', (error as ServiceError).message);
  }
});

exports.turtleWebhook = functions.https.onRequest(async (request: functions.https.Request, response: Response) => {
  if (!validateWebhookCall(request)) {
    response.status(403).send('Unauthorized.');
    return;
  }

  const eventCode: string = request.body.code;

  if (eventCode.startsWith('deposit') || eventCode.startsWith('withdrawal')) {
    const accountId: string = request.body.data.accountId;

    await db.refreshAccount(accountId);
    response.status(200).send('OK');
  }
});

exports.refundUnclaimedTips = functions.pubsub.schedule('every 6 hours').onRun(async (context) => {
  const expiredTips = await db.getExpiredTips();

  if (expiredTips.length === 0) {
    return;
  }

  const unclaimedTipGroups = groupBy(expiredTips, t => t.recipientGithubId);

  const promisses: Promise<any>[] = [];

  for (const githubId in unclaimedTipGroups) {
    const accountTips = unclaimedTipGroups[githubId];

    promisses.push(refundAccountUnclaimedTips(Number.parseInt(githubId), accountTips));
  }

  return Promise.all(promisses);
});

async function sendPreparedWithdrawal(
  preparedWithdrawal: WithdrawalPreview
): Promise<[Withdrawal | undefined, undefined | ServiceError]> {
  return TrtlApp.withdraw(preparedWithdrawal.id);
}

async function refundAccountUnclaimedTips(githubId: number, tips: UnclaimedTip[]): Promise<void> {
  // refund tips received by this account, if that account still doesn't have an AppUser
  const appUserSnapshot = await admin.firestore().collection('users').where('githubId', '==', githubId).get();

  if (appUserSnapshot.size > 0) {
    // this appUser now exists, don't refund tips and delete the unclaimed tip docs
    await db.deleteUnclaimedTips(tips.map(t => t.id));
    return;
  }

  await Promise.all(tips.map(t => refundUnclaimedTip(t)));
}

async function refundUnclaimedTip(tip: UnclaimedTip): Promise<boolean> {
  try {
    await admin.firestore().runTransaction(async (txn) => {
      const unclaimedTipRef = admin.firestore().doc(`unclaimed_tips/${tip.id}`);
      txn.delete(unclaimedTipRef);

      const [transfer, transferError] = await TrtlApp.transfer(tip.recipients[0].accountId, tip.senderId, tip.recipients[0].amount);

      if (!transfer) {
        throw (transferError as ServiceError).message;
      }
    });

    await Promise.all([
      db.refreshAccount(tip.senderId),
      db.refreshAccount(tip.recipients[0].accountId)
    ]);

    return true;
  } catch (e) {
    console.log('refund tip failure: ', e);
    return false;
  }
}

async function prepareWithdrawToAddress(
  userId: string,
  amount: number,
  address: string
): Promise<[WithdrawalPreview | undefined, AppError | undefined]> {
  const [appUser, userError] = await db.getAppUserByUid(userId);

  if (!appUser) {
    return [undefined, userError];
  }

  if (!appUser.githubId) {
    return [undefined, new AppError('github/user-not-found')];
  }

  const [account, accountError] = await db.getTurtleAccount(appUser.githubId);

  if (!account) {
    return [undefined, accountError];
  }

  const [preview, error] = await TrtlApp.withdrawalPreview(account.id, amount, address);

  if (!preview) {
    return [undefined, (error as AppError)];
  }

  const docRef = admin.firestore().collection(`users/${userId}/preparedWithdrawals`).doc();
  await docRef.create(preview);

  return [preview, undefined];
}

function validateWebhookCall(request: functions.https.Request): boolean {
  const requestSignature = request.get('x-trtl-apps-signature');

  if (!requestSignature) {
    return false;
  }

  const hash = 'sha256=' + crypto
                .createHmac("sha256", turtleConfig.app_secret)
                .update(JSON.stringify(request.body))
                .digest("hex");

  return hash === requestSignature;
}