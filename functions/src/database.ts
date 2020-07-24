import * as admin from 'firebase-admin';
import { TrtlApp, Account, ServiceError, WithdrawalPreview } from 'trtl-apps';
import { AppError } from './appError';
import { WebAppUser, Config } from './types';

export async function getAppUserByUid(uid: string): Promise<[WebAppUser | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().doc(`users/${uid}`).get();

  if (snapshot.exists) {
    return [snapshot.data() as WebAppUser, undefined];
  } else {
    return [undefined, new AppError('app/user-not-found')];
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

export async function getAccountOwner(accountId: string): Promise<[WebAppUser | undefined, undefined | AppError]> {
  console.log(`get AppUser by accountId: [${accountId}]...`);

  const snapshot = await admin.firestore()
                    .collection('users')
                    .where('accountId', '==', accountId)
                    .get();

  if (snapshot.size !== 1) {
    return [undefined, new AppError('app/user-not-found')];
  }

  return [snapshot.docs[0].data() as WebAppUser, undefined];
}

export async function getPreparedWithdrawal(
  userId: string,
  preparedWithdrawalId: string
): Promise<WithdrawalPreview | null> {
  const snapshot = await admin.firestore().doc(`users/${userId}/prepared_withdrawals/${preparedWithdrawalId}`).get();

  if (snapshot.exists) {
    return snapshot.data() as WithdrawalPreview;
  } else {
    return null;
  }
}

export async function getConfig(): Promise<[Config | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().doc('globals/config').get();

  if (snapshot.exists) {
    return [snapshot.data() as Config, undefined];
  } else {
    return [undefined, new AppError('app/config')];
  }
}