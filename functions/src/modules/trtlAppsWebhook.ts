import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as db from '../database';
import * as crypto from 'crypto';
import { Withdrawal, Deposit } from "trtl-apps";
import { Transaction } from "../types";

type CallbackCode =   'deposit/confirming'      |
                      'deposit/succeeded'       |
                      'deposit/cancelled'       |
                      'withdrawal/succeeded'    |
                      'withdrawal/failed'

const turtleConfig = functions.config().trtl;

export const webhook = functions.https.onRequest(async (request: functions.https.Request, response: functions.Response) => {
  if (!validateWebhookCall(request)) {
    response.status(403).send('Unauthorized.');
    return;
  }

  await processWebhookCall(request.body);
  response.status(200).send('OK');
});

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

async function processWebhookCall(requestBody: any): Promise<void> {
  const code: CallbackCode | undefined = requestBody.code;
  const data: any = requestBody.data;

  if (!code || !data) {
    console.log('Invalid webhook payload.');
    return;
  }

  console.log(`process webhook call: ${code}`);

  switch (code) {
    case 'deposit/confirming':
      await proccesConfirmingDeposit(data as Deposit);
      break;
    case 'deposit/succeeded':
      await processSuccessfulDeposit(data as Deposit);
      break;
    case 'deposit/cancelled':
      await processCancelledDeposit(data as Deposit);
      break;
    case 'withdrawal/succeeded':
      await processWithdrawalSucceeded(data as Withdrawal);
      break;
    case 'withdrawal/failed':
      await processWithdrawalFailed(data as Withdrawal);
      break;
    default:
      console.log(`Invalid webhook callback code: ${code}`);
      return;
  }
}

async function proccesConfirmingDeposit(deposit: Deposit): Promise<void> {
  console.log(`process confirming deposit: ${deposit.id}`);

  await db.refreshAccount(deposit.accountId);

  if (!deposit.txHash) {
    console.log('missing deposit tx hash!');
    return;
  }

  const txDocRef = admin.firestore().collection(`accounts/${deposit.accountId}/transactions`).doc();

  const tx: Transaction = {
    id:           txDocRef.id,
    accountId:    deposit.accountId,
    timestamp:    deposit.createdDate,
    transferType: 'deposit',
    amount:       deposit.amount,
    fee:          0,
    status:       'confirming',
    depositId:    deposit.id,
    txHash:       deposit.txHash,
    paymentId:    deposit.paymentId,
  }

  await txDocRef.set(tx);
}

async function processSuccessfulDeposit(deposit: Deposit): Promise<void> {
  console.log(`process successful deposit: ${deposit.id}`);

  await db.refreshAccount(deposit.accountId);

  const snapshot = await admin.firestore()
                    .collection(`accounts/${deposit.accountId}/transactions`)
                    .where('depositId', '==', deposit.id)
                    .get();

  if (snapshot.size !== 1) {
    console.log(`transaction doc for deposit id [${deposit.id}] not found!`);
    return;
  }

  const transaction = snapshot.docs[0].data() as Transaction;

  const update: Partial<Transaction> = {
    status: 'completed'
  }

  await admin.firestore()
    .doc(`accounts/${deposit.accountId}/transactions/${transaction.id}`)
    .update(update);
}

async function processCancelledDeposit(deposit: Deposit): Promise<void> {
  console.log(`process cancelled deposit: ${deposit.id}`);

  await db.refreshAccount(deposit.accountId);

  const snapshot = await admin.firestore()
                    .collection(`accounts/${deposit.accountId}/transactions`)
                    .where('depositId', '==', deposit.id)
                    .get();

  if (snapshot.size !== 1) {
    console.log(`transaction doc for deposit id [${deposit.id}] not found!`);
    return;
  }

  const transaction = snapshot.docs[0].data() as Transaction;

  const update: Partial<Transaction> = {
    status: 'failed'
  }

  await admin.firestore()
    .doc(`accounts/${deposit.accountId}/transactions/${transaction.id}`)
    .update(update);
}

async function processWithdrawalSucceeded(withdrawal: Withdrawal): Promise<void> {
  console.log(`process withdrawal succeeded: ${withdrawal.id}`);

  await db.refreshAccount(withdrawal.accountId);

  const snapshot = await admin.firestore()
                    .collection(`accounts/${withdrawal.accountId}/transactions`)
                    .where('withdrawalId', '==', withdrawal.id)
                    .get();

  if (snapshot.size !== 1) {
    console.log(`transaction doc for withdrawal id [${withdrawal.id}] not found!`);
    return;
  }

  const transaction = snapshot.docs[0].data() as Transaction;

  const update: Partial<Transaction> = {
    status: 'completed'
  }

  await admin.firestore()
    .doc(`accounts/${withdrawal.accountId}/transactions/${transaction.id}`)
    .update(update);
}

async function processWithdrawalFailed(withdrawal: Withdrawal): Promise<void> {
  console.log(`process cancelled deposit: ${withdrawal.id}`);

  await db.refreshAccount(withdrawal.accountId);

  const snapshot = await admin.firestore()
                    .collection(`accounts/${withdrawal.accountId}/transactions`)
                    .where('withdrawalId', '==', withdrawal.id)
                    .get();

  if (snapshot.size !== 1) {
    console.log(`transaction doc for withdrawal id [${withdrawal.id}] not found!`);
    return;
  }

  const transaction = snapshot.docs[0].data() as Transaction;

  const update: Partial<Transaction> = {
    status: 'failed'
  }

  await admin.firestore()
    .doc(`accounts/${withdrawal.accountId}/transactions/${transaction.id}`)
    .update(update);
}