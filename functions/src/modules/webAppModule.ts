import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as core from './core/coreModule';
import { onAuthUserCreated as processNewGithubAuthUser } from './github/githubModule';
import { AppError } from '../appError';
import { WithdrawalPreview, ServiceError, Account } from 'trtl-apps';
import { WebAppUser, UserTurtleAccount } from '../types';

export const onNewAuthUserCreated = functions.auth.user().onCreate(async (user) => {
  console.log(`creating new user => uid: ${user.uid}`);
  console.log(`user provider data: ${JSON.stringify(user.providerData)}`);

  if (user.providerData.some(p => p.providerId === 'github.com')) {
    await processNewGithubAuthUser(user);
  } else {
    console.log(`unsupported provider: ${JSON.stringify(user.providerData)}, deleting auth user [${user.uid}]...`);
    await admin.auth().deleteUser(user.uid);
    return;
  }
});

export const userAgreeDisclaimer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
  }

  await admin.firestore().doc(`users/${context.auth.uid}`).update({
    disclaimerAccepted: true
  });
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

  const [appUser, userError] = await getAppUserByUid(userId);

  if (!appUser) {
    console.log((userError as AppError).message);
    throw new functions.https.HttpsError('not-found', (userError as AppError).message);
  }

  if (!appUser.primaryAccountId) {
    throw new functions.https.HttpsError('not-found', 'User does not have a primary turtle account.');
  }

  const [primaryAccount] = await core.getAccount(appUser.primaryAccountId);

  if (!primaryAccount) {
    throw new functions.https.HttpsError('not-found', 'user account not found.');
  }

  const preparedWithdrawal = await core.getPreparedWithdrawal(primaryAccount.id, preparedWithdrawalId);

  if (!preparedWithdrawal) {
    throw new functions.https.HttpsError('not-found', 'Prepared withdrawal not found.');
  }

  const [withdrawal, error] = await core.sendPreparedWithdrawal(preparedWithdrawal, 'webapp');

  if (withdrawal) {
    return withdrawal;
  } else {
    throw new functions.https.HttpsError('aborted', (error as ServiceError).message);
  }
});

export async function linkUserTurtleAccount(appUser: WebAppUser, account: Account): Promise<boolean> {
  // check if account is already linked with a user
  const matchQuery = await admin.firestore().collectionGroup('turtle_accounts')
                      .where('accountId', '==', account.id)
                      .get();

  if (matchQuery.size > 0) {
    const matchedAccount = matchQuery.docs[0].data() as UserTurtleAccount;
    console.log(`turtle account [${matchedAccount.accountId}] already linked to user [${appUser.uid}]!`);

    return false;
  }

  // check if this should be the user's primary account
  const snapshot = await admin.firestore()
                    .collection(`users/${appUser.uid}/turtle_accounts`)
                    .where('primary', '==', true)
                    .get();

  const isPrimary = snapshot.size === 0;
  const promises: Promise<any>[] = [];

  // add account to user's list of turtle_accounts
  const userTurtleAccount: UserTurtleAccount = {
    accountId: account.id,
    userId: appUser.uid,
    primary: isPrimary,
    balanceUnlocked: account.balanceUnlocked
  }

  const addAccountPromise = admin.firestore()
    .doc(`users/${appUser.uid}/turtle_accounts/${account.id}`)
    .set(userTurtleAccount);

  promises.push(addAccountPromise);

  if (isPrimary) {
    const userUpdate: Partial<WebAppUser> = {
      primaryAccountId: account.id
    }

    const updateUserPromise = admin.firestore()
      .doc(`users/${appUser.uid}`)
      .update(userUpdate);

    promises.push(updateUserPromise);
  }

  await Promise.all(promises);
  console.log(`linked turtle account [${account.id}] with app user [${appUser.uid}].`);

  return true;
}

export async function getAccountOwner(accountId: string): Promise<[WebAppUser | undefined, undefined | AppError]> {
  const accountsSnapshot = await admin.firestore()
                            .collectionGroup('turtle_accounts')
                            .where('accountId', '==', accountId)
                            .get();

  if (accountsSnapshot.size === 0) {
    return [undefined, new AppError('app/user-not-found')];
  }

  const account = accountsSnapshot.docs[0].data() as UserTurtleAccount;

  return getAppUserByUid(account.userId);
}

async function getAppUserByUid(uid: string): Promise<[WebAppUser | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().doc(`users/${uid}`).get();

  if (snapshot.exists) {
    return [snapshot.data() as WebAppUser, undefined];
  } else {
    return [undefined, new AppError('app/user-not-found')];
  }
}

async function prepareWithdrawToAddress(
  userId: string,
  amount: number,
  address: string
): Promise<[WithdrawalPreview | undefined, AppError | undefined]> {
  const [appUser, userError] = await getAppUserByUid(userId);

  if (!appUser) {
    return [undefined, userError];
  }

  if (!appUser.primaryAccountId) {
    throw new functions.https.HttpsError('not-found', 'User does not have a primary turtle account.');
  }

  const [primaryAccount] = await core.getAccount(appUser.primaryAccountId);

  if (!primaryAccount) {
    return [undefined, new AppError('app/user-no-account', `app user ${appUser.uid} doesn't have a turtle account assigned!`)];
  }

  return core.prepareWithdrawal(primaryAccount.id, amount, address);
}
