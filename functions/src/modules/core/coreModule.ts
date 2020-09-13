import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as crypto from 'crypto';
import { TrtlApp, Account, ServiceError, WithdrawalPreview, Withdrawal } from 'trtl-apps';
import { processWebhookCall } from './trtlAppsWebhook';
import { AppError } from '../../appError';
import { Config, Transaction, Platform, AccountProvider, WebAppUser, LinkedTurtleAccount, ITurtleAccountLinker } from '../../types';

export async function getConfig(): Promise<[Config | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().doc('globals/config').get();

  if (snapshot.exists) {
    return [snapshot.data() as Config, undefined];
  } else {
    return [undefined, new AppError('app/config')];
  }
}

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

export async function accountTransfer(fromId: string, toId: string, amount: number) {
  return TrtlApp.transfer(fromId, toId, amount);
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
  preparedWithdrawal: WithdrawalPreview,
  platform: Platform
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
    platform:       platform,
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

export async function updatePlatformAccountLink(
  authUser: admin.auth.UserRecord,
  linkedAccounts: LinkedTurtleAccount[],
  linker: ITurtleAccountLinker
) {
  const provider = linker.accountProvider;
  const linkedAcc = linkedAccounts.find(a => a.provider === linker.accountProvider);

  if (linkedAcc) {
    return `${provider} account already linked.`;
  }

  // update user data with platform info if needed
  await linker.updateAppUserPlatformData(authUser);

  if (!await linker.validateAccountLinkRequirements(authUser)) {
    return `${provider} account link requirements not met.`;
  }

  const existingAccount = await linker.getExistingPlatformAccount(authUser.uid);

  if (existingAccount) {
    const linked = await linkUserTurtleAccount(authUser.uid, existingAccount, linker.accountProvider);

    if (linked) {
      if (linker.onTurtleAccountLinked) {
        await linker.onTurtleAccountLinked(authUser.uid, existingAccount, false);
      }
      return `${provider} existing account linked`;
    } else {
      return `${provider} failed to link existing platform account!`;
    }
  }

  const newAccount = await linker.createNewPlatformAccount(authUser.uid);

  if (newAccount) {
    const linked = await linkUserTurtleAccount(authUser.uid, newAccount, linker.accountProvider);

    if (linked) {
      if (linker.onTurtleAccountLinked) {
        await linker.onTurtleAccountLinked(authUser.uid, newAccount, true);
      }
      return `${provider} linked new platform account`;
    } else {
      return `${provider} failed to link new platform account!`;
    }
  } else {
    return `${provider} failed to create new platfom account`;
  }
}

export const trtlAppsWebhook = functions.https.onRequest(async (request: functions.https.Request, response: functions.Response) => {
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

  const trtlAppsConfig = functions.config().trtl;

  const hash = 'sha256=' + crypto
                .createHmac("sha256", trtlAppsConfig.app_secret)
                .update(JSON.stringify(request.body))
                .digest("hex");

  return hash === requestSignature;
}

async function linkUserTurtleAccount(userId: string, account: Account, provider: AccountProvider): Promise<boolean> {
  // check if account is already linked with a user
  const matchQuery = await admin.firestore().collectionGroup('turtle_accounts')
                      .where('accountId', '==', account.id)
                      .get();

  if (matchQuery.size > 0) {
    const matchedAccount = matchQuery.docs[0].data() as LinkedTurtleAccount;
    console.log(`turtle account [${matchedAccount.accountId}] already linked to user [${userId}]!`);

    return false;
  }

  // check if this should be the user's primary account
  const snapshot = await admin.firestore()
                    .collection(`users/${userId}/turtle_accounts`)
                    .where('primary', '==', true)
                    .get();

  const isPrimary = snapshot.size === 0;
  const promises: Promise<any>[] = [];

  // add account to user's list of linked turtle_accounts
  const linkedTurtleAccount: LinkedTurtleAccount = {
    provider: provider,
    accountId: account.id,
    userId: userId,
    primary: isPrimary,
    balanceUnlocked: account.balanceUnlocked
  }

  const addAccountPromise = admin.firestore()
    .doc(`users/${userId}/turtle_accounts/${account.id}`)
    .set(linkedTurtleAccount);

  promises.push(addAccountPromise);

  if (isPrimary) {
    const userUpdate: Partial<WebAppUser> = {
      primaryAccountId: account.id
    }

    const updateUserPromise = admin.firestore()
      .doc(`users/${userId}`)
      .update(userUpdate);

    promises.push(updateUserPromise);
  }

  await Promise.all(promises);

  return true;
}