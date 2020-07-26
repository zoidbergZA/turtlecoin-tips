import * as admin from 'firebase-admin';
import { TrtlApp, Account, ServiceError, WithdrawalPreview, Withdrawal } from 'trtl-apps';
import { AppError } from './appError';
import { Config, Transaction } from './types';

export async function getConfig(): Promise<[Config | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().doc('globals/config').get();

  if (snapshot.exists) {
    return [snapshot.data() as Config, undefined];
  } else {
    return [undefined, new AppError('app/config')];
  }
}

export async function getAccount(id: string): Promise<[Account | undefined, undefined | AppError]> {
  const accountDoc = await admin.firestore().doc(`accounts/${id}`).get();

  if (accountDoc.exists) {
    return [accountDoc.data() as Account, undefined];
  } else {
    return [undefined, new AppError('app/user-no-account')];
  }
}

export async function refreshAccount(accountId: string): Promise<void> {
 const [account, accError] = await TrtlApp.getAccount(accountId);

  if (!account) {
    console.log(`error refreshing account: ${(accError as ServiceError).message}`);
    return;
  }

  await admin.firestore().doc(`accounts/${accountId}`).set(account);
}

export async function prepareWithdrawal(
  accountId: string,
  amount: number,
  address: string
): Promise<[WithdrawalPreview | undefined, undefined | AppError]> {
  const [account, accountError] = await getAccount(accountId);

  if (!account) {
    return [undefined, accountError];
  }

  const [preview, error] = await TrtlApp.withdrawalPreview(account.id, amount, address);

  if (!preview) {
    return [undefined, (error as AppError)];
  }

  const docRef = admin.firestore().doc(`accounts/${accountId}/prepared_withdrawals/${preview.id}`);
  await docRef.create(preview);

  return [preview, undefined];
}

export async function getPreparedWithdrawal(
  accountId: string,
  preparedWithdrawalId: string
): Promise<WithdrawalPreview | null> {
  const snapshot = await admin.firestore()
                    .doc(`accounts/${accountId}/prepared_withdrawals/${preparedWithdrawalId}`)
                    .get();

  if (snapshot.exists) {
    return snapshot.data() as WithdrawalPreview;
  } else {
    return null;
  }
}

export async function sendPreparedWithdrawal(
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
    accountId:      withdrawal.accountId,
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
    refreshAccount(preparedWithdrawal.accountId)
  ]);

  return [withdrawal, undefined];
}
