import * as admin from 'firebase-admin';
import { TrtlApp, Account, ServiceError, Transfer, WithdrawalPreview } from 'trtl-apps';
import { AppError } from './appError';
import { Octokit } from '@octokit/rest';
import { AppUser, AppConfig, UnclaimedTip, GithubUser } from './types';

const octokit = new Octokit({});

// TODO: refactor to other module (Utils?)
export async function getGithubIdByUsername(username: string): Promise<[number | undefined, undefined | AppError]> {
  try {
    const response = await octokit.users.getByUsername({
      username: username
    });

    return [response.data.id, undefined];
  } catch (error) {
    console.log(error);
    return [undefined, new AppError('github/user-not-found', error)];
  }
}

export async function getAppUserByUid(uid: string): Promise<[AppUser | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().doc(`users/${uid}`).get();

  if (snapshot.exists) {
    return [snapshot.data() as AppUser, undefined];
  } else {
    return [undefined, new AppError('app/user-not-found')];
  }
}

export async function getAppUserByGithubId(githubId: number): Promise<[AppUser | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().collection(`users`)
                    .where('githubId', '==', githubId)
                    .get();

  if (snapshot.size !== 1) {
    return [undefined, new AppError('app/user-no-account')];
}

  return [snapshot.docs[0].data() as AppUser, undefined];
}

export async function getGithubUser(githubId: number): Promise<[GithubUser | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().doc(`github_users/${githubId}`).get();

  if (snapshot.exists) {
    return [snapshot.data() as GithubUser, undefined];
  } else {
    return [undefined, new AppError('github/user-not-found')];
  }
}

/**
 * Retrieves a turtle account by account ID or github ID.
 *
 * @param id if a string is provided, fetches account by account ID, else by github ID (number).
 */
export async function getTurtleAccount(id: number | string): Promise<[Account | undefined, undefined | AppError]> {
  let accountId: string | undefined;

  if (typeof(id) === 'number') {
    const [githubUser, userError] = await getGithubUser(id);

    if (!githubUser) {
      return [undefined, userError];
    }

    accountId = githubUser.accountId;
  }

  if (typeof(id) === 'string') {
    accountId = id;
  }

  const accountDoc = await admin.firestore().doc(`accounts/${accountId}`).get();

  if (accountDoc.exists) {
    return [accountDoc.data() as Account, undefined];
  } else {
    return [undefined, new AppError('app/user-no-account')];
  }
}

export async function createGithubUser(githubId: number): Promise<[GithubUser | undefined, undefined | AppError]> {
  const [account, accError] = await TrtlApp.createAccount();

  if (!account) {
    return [undefined, new AppError('app/create-account', (accError as ServiceError).message)];
  }

  try {
    const githubUser: GithubUser = {
      githubId: githubId,
      accountId: account.id
    }

    const batch = admin.firestore().batch();

    batch.create(admin.firestore().doc(`accounts/${account.id}`), account);
    batch.create(admin.firestore().doc(`github_users/${githubId}`), githubUser);

    await batch.commit();

    return [githubUser, undefined];
  } catch (error) {
    return [undefined, new AppError('app/create-account', `error creating GithubUser for id: ${githubId}`)];
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

export async function getAccountOwner(accountId: string): Promise<[AppUser | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore()
                    .collection('users')
                    .where('accountId', '==', accountId)
                    .get();

  if (snapshot.size !== 1) {
    return [undefined, new AppError('app/user-not-found')];
  }

  return [snapshot.docs[0].data() as AppUser, undefined];
}

export async function getPreparedWithdrawal(
  userId: string,
  preparedWithdrawalId: string
): Promise<WithdrawalPreview | null> {
  const snapshot = await admin.firestore().doc(`users/${userId}/preparedWithdrawals/${preparedWithdrawalId}`).get();

  if (snapshot.exists) {
    return snapshot.data() as WithdrawalPreview;
  } else {
    return null;
  }
}

export async function createUnclaimedTipDoc(
  transfer: Transfer,
  timeoutDays: number,
  senderUsername: string,
  recipientUsername: string,
  recipientGithubId: number
): Promise<[UnclaimedTip | undefined, undefined | AppError]> {
  if (timeoutDays < 1) {
    return [undefined, new AppError('app/unclaimed-tip', `Invalid tip timout days param [${timeoutDays}], must value be > 0.`)];
  }

  try {
    const unclaimedTip: UnclaimedTip = {
      id:           transfer.id,
      appId:        transfer.appId,
      senderId:     transfer.senderId,
      recipients:   transfer.recipients,
      timestamp:    transfer.timestamp,
      timeoutDate:  transfer.timestamp + (timeoutDays * 24 * 60 * 60 * 1000),
      timeoutDays,
      recipientGithubId,
      senderUsername,
      recipientUsername
    }

    await admin.firestore().doc(`unclaimed_tips/${transfer.id}`).set(unclaimedTip);
    return [unclaimedTip, undefined];
  } catch (error) {
    return [undefined, new AppError('app/unclaimed-tip', error)];
  }
}

export async function getUnclaimedTips(githubId?: number, expired: boolean = false): Promise<UnclaimedTip[]> {
  const query = admin.firestore().collection('unclaimed_tips');

  if (githubId) {
    query.where('recipientGithubId', '==', githubId);
  }

  if (expired) {
    query.where('timeoutDate', '<', Date.now());
  }

  const snapshot = await query.get();
  return snapshot.docs.map(d => d.data() as UnclaimedTip);
}

export async function deleteUnclaimedTips(tipIds: string[]): Promise<boolean> {
  try {
    const batch = admin.firestore().batch();

    tipIds.forEach(id => {
      batch.delete(admin.firestore().doc(`unclaimed_tips/${id}`));
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function getAppConfig(): Promise<[AppConfig | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().doc('globals/config').get();

  if (snapshot.exists) {
    return [snapshot.data() as AppConfig, undefined];
  } else {
    return [undefined, new AppError('app/config')];
  }
}