import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as db from '../database';
import { onNewGithubUser } from './github/githubModule';
import { AppError } from '../appError';
import { WithdrawalPreview, TrtlApp, ServiceError, Withdrawal } from 'trtl-apps';
import { Transaction } from '../types';

export const onNewAuthUserCreated = functions.auth.user().onCreate(async (user) => {
  console.log(`creating new user => uid: ${user.uid}`);
  console.log(`user provider data: ${JSON.stringify(user.providerData)}`);

  if (user.providerData.some(p => p.providerId === 'github')) {
    await onNewGithubUser(user);
  } else {
    console.log(`unsupported provider: ${JSON.stringify(user.providerData)}, deleting auth user [${user.uid}]...`);
    await admin.auth().deleteUser(user.uid);
    return;
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

async function prepareWithdrawToAddress(
  userId: string,
  amount: number,
  address: string
): Promise<[WithdrawalPreview | undefined, AppError | undefined]> {
  const [appUser, userError] = await db.getAppUserByUid(userId);

  if (!appUser) {
    return [undefined, userError];
  }

  if (!appUser.accountId) {
    return [undefined, new AppError('app/user-no-account', `app user ${appUser.uid} doesn't have a turtle account id assigned!`)];
  }

  const [account, accountError] = await db.getAccount(appUser.accountId);

  if (!account) {
    return [undefined, accountError];
  }

  const [preview, error] = await TrtlApp.withdrawalPreview(account.id, amount, address);

  if (!preview) {
    return [undefined, (error as AppError)];
  }

  const docRef = admin.firestore().doc(`users/${userId}/prepared_withdrawals/${preview.id}`);
  await docRef.create(preview);

  return [preview, undefined];
}

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
    amount:         -withdrawal.amount,
    fee:            -fee,
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