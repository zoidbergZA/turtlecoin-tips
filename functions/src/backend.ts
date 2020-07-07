import * as admin from 'firebase-admin';
import { TrtlApp, Account } from 'trtl-apps';
import { AppError } from './appError';
import { Octokit } from '@octokit/rest';
import { AppUser } from './types';

const octokit = new Octokit({});

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

export async function getAppUserByGithubId(githubId: number): Promise<[AppUser | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().collection(`users`)
                    .where('githubId', '==', githubId)
                    .get();

  if (snapshot.size !== 1) {
    return [undefined, new AppError('app/user-no-account')];
}

  return [snapshot.docs[0].data() as AppUser, undefined];
}

export async function getTurtleAccount(
  githubId: number,
  autoCreate: boolean = false
): Promise<[Account | undefined, undefined | AppError]> {
  const accountDoc = await admin.firestore().doc(`accounts/${githubId}`).get();

  if (accountDoc.exists) {
    return [accountDoc.data() as Account, undefined];
  }

  if (autoCreate) {
    return await createTurtleAccount(githubId);
  } else {
    return [undefined, new AppError('app/user-no-account')];
  }
}

export async function createTurtleAccount(githubId: number): Promise<[Account | undefined, undefined | AppError]> {
  const [account, accError] = await TrtlApp.createAccount();

  if (!account) {
    return [undefined, new AppError('app/create-account', accError?.message)];
  }

  try {
    await admin.firestore().doc(`accounts/${githubId}`).create(account);
    return [account, undefined];
  } catch (error) {
    return [undefined, new AppError('app/create-account')];
  }
}