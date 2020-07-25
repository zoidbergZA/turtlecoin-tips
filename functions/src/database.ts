import * as admin from 'firebase-admin';
import { TrtlApp, Account, ServiceError } from 'trtl-apps';
import { AppError } from './appError';
import { Config } from './types';

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

export async function getConfig(): Promise<[Config | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().doc('globals/config').get();

  if (snapshot.exists) {
    return [snapshot.data() as Config, undefined];
  } else {
    return [undefined, new AppError('app/config')];
  }
}