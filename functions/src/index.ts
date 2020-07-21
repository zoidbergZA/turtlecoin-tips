import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as crypto from 'crypto';
import * as db from './database';
import * as SendTipCommand from './commands/sendTip';
import { Request, Response } from 'express';
import { TrtlApp, ServiceError, WithdrawalPreview, Withdrawal } from 'trtl-apps';
import { createProbot, Options } from 'probot'
import { UnclaimedTip, AppUser, Transaction } from './types';
import { AppError } from './appError';
import { processWebhookCall } from './webhookModule';
import groupBy from 'lodash.groupby';

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

  const githubInfo = user.providerData[0];

  const appUser: AppUser = {
    uid: user.uid,
    username: githubInfo.displayName,
    githubId: Number.parseInt(githubInfo.uid)
  }

  if (appUser.githubId) {
    const [account] = await db.getTurtleAccount(appUser.githubId);

    if (account) {
      appUser.accountId = account.id;

      // if the new user already has a tips account, cancel all unclaimed tips.
      const tips = await db.getUnclaimedTips(appUser.githubId);

      if (tips.length > 0) {
        await db.deleteUnclaimedTips(tips.map(t => t.id));
      }
    } else {
      const [githubUser, userError] = await db.createGithubUser(appUser.githubId);

      if (githubUser) {
        appUser.accountId = githubUser.accountId;
      } else {
        console.log(`error creating account for app user [${appUser.uid}]: ${(userError as AppError).message}`);
      }
    }
  }

  await admin.firestore().doc(`users/${appUser.uid}`).set(appUser);
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

  const [appUser, userError] = await db.getAppUserByUid(userId);

  if (!appUser) {
    console.log((userError as AppError).message);
    throw new functions.https.HttpsError('not-found', (userError as AppError).message);
  }

  if (!appUser.githubId) {
    throw new functions.https.HttpsError('not-found', 'user github ID not found.');
  }

  const preparedWithdrawal = await db.getPreparedWithdrawal(userId, preparedWithdrawalId);

  if (!preparedWithdrawal) {
    throw new functions.https.HttpsError('not-found', 'Prepared withdrawal not found.');
  }

  const [withdrawal, error] = await sendPreparedWithdrawal(userId, appUser.githubId, preparedWithdrawal);

  if (withdrawal) {
    return withdrawal;
  } else {
    throw new functions.https.HttpsError('aborted', (error as ServiceError).message);
  }
});

exports.turtleWebhook = functions.https.onRequest(async (request: functions.https.Request, response: functions.Response) => {
  if (!validateWebhookCall(request)) {
    response.status(403).send('Unauthorized.');
    return;
  }

  await processWebhookCall(request.body);
  response.status(200).send('OK');
});

exports.refundUnclaimedTips = functions.pubsub.schedule('every 6 minutes').onRun(async (context) => {
  const expiredTips = await db.getUnclaimedTips(undefined, true);

  if (expiredTips.length === 0) {
    return;
  }

  expiredTips.forEach(t => {
    const now = Date.now();

    console.log(`found expired unclaimed tip: id: ${t.id}, timeoutDate: ${t.timeoutDate}, now: ${now}`);
  });

  const unclaimedTipGroups = groupBy(expiredTips, t => t.recipientGithubId);

  const promisses: Promise<any>[] = [];

  for (const githubId in unclaimedTipGroups) {
    const accountTips = unclaimedTipGroups[githubId];

    promisses.push(refundAccountUnclaimedTips(Number.parseInt(githubId), accountTips));
  }

  return Promise.all(promisses);
});

async function sendPreparedWithdrawal(
  userId: string,
  githubId: number,
  preparedWithdrawal: WithdrawalPreview
): Promise<[Withdrawal | undefined, undefined | ServiceError]> {
  const [withdrawal, error] = await TrtlApp.withdraw(preparedWithdrawal.id);

  if (!withdrawal) {
    return [undefined, error];
  }

  const docRef = admin.firestore().collection(`accounts/${preparedWithdrawal.accountId}/transactions`).doc();
  const fee = withdrawal.fees.nodeFee + withdrawal.fees.serviceFee + withdrawal.fees.txFee;

  const transaction: Transaction = {
    id:             docRef.id,
    userId:         userId,
    accountId:      withdrawal.accountId,
    githubId:       githubId,
    timestamp:      withdrawal.timestamp,
    transferType:   'withdrawal',
    amount:         withdrawal.amount,
    fee:            fee,
    status:         'confirming',
    sendAddress:    withdrawal.address,
    withdrawalId:   withdrawal.id,
    txHash:         withdrawal.txHash,
    paymentId:      withdrawal.paymentId
  }

  await Promise.all([
    docRef.set(transaction),
    db.refreshAccount(preparedWithdrawal.accountId)
  ]);

  return [withdrawal, undefined];
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

async function refundUnclaimedTip(unclaimedTip: UnclaimedTip): Promise<void> {
  console.log(`refund unclaimed tip => id: ${unclaimedTip.id}, timeoutDate: ${unclaimedTip.timeoutDate}, now: ${Date.now()}`);

  const recipientAccountId = unclaimedTip.recipients[0].accountId;

  try {
    const transfer = await admin.firestore().runTransaction(async (txn) => {
      const unclaimedTipRef = admin.firestore().doc(`unclaimed_tips/${unclaimedTip.id}`);
      txn.delete(unclaimedTipRef);

      // send back the original tip
      const [result, transferError] = await TrtlApp.transfer(recipientAccountId, unclaimedTip.senderId, unclaimedTip.recipients[0].amount);

      if (!result) {
        throw (transferError as ServiceError).message;
      }

      return result;
    });

    const promisses: Promise<any>[] = [];

    promisses.push(db.refreshAccount(unclaimedTip.senderId));
    promisses.push(db.refreshAccount(recipientAccountId));

    // create 'tipRefund' transaction doc in original sender's history
    const refundDocRef = admin.firestore().collection(`accounts/${unclaimedTip.senderId}/transactions`).doc();
    const refundTx: Transaction = {
      id:                 refundDocRef.id,
      accountId:          recipientAccountId,
      timestamp:          transfer.timestamp,
      transferType:       'tipRefund',
      amount:             transfer.recipients[0].amount,
      fee:                0,
      status:             'completed',
      accountTransferId:  transfer.id,
      senderUsername:     unclaimedTip.recipientUsername,
      recipientUsername:  unclaimedTip.senderUsername
    }

    promisses.push(refundDocRef.set(refundTx));

    // delete unclaimed tip from original recipient's transaction history
    console.log(`delete original sender's tip transaction doc => account id: ${unclaimedTip.recipients[0].accountId}, accountTransferId: ${unclaimedTip.id}`);

    const snapshot = await admin.firestore()
                      .collection(`accounts/${unclaimedTip.recipients[0].accountId}/transactions`)
                      .where('accountTransferId', '==', unclaimedTip.id)
                      .get();

    if (snapshot.size === 1) {
      promisses.push(snapshot.docs[0].ref.delete());
    }

    await Promise.all(promisses);
  } catch (e) {
    console.log('refund tip failure: ', e);
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

  const docRef = admin.firestore().doc(`users/${userId}/preparedWithdrawals/${preview.id}`);
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