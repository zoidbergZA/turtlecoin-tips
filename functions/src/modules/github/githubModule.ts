import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as core from '../core/coreModule';
import * as bot from './bot/bot';
import groupBy from 'lodash.groupby';
import { DocumentData, Query } from '@google-cloud/firestore';
import { Octokit } from '@octokit/rest';
import { Request, Response } from 'express';
import { AppError } from '../../appError';
import { WebAppUser, UnclaimedTip, Transaction, GithubUser, ITurtleAccountLinker } from '../../types';
import { TrtlApp, ServiceError, Transfer, Account } from 'trtl-apps';

const octokit = new Octokit({});

export const githHubAccountLinker: ITurtleAccountLinker = {
  accountProvider: 'github.com',
  async updateAppUserPlatformData(authUser: admin.auth.UserRecord): Promise<void> {
    const provider = authUser.providerData.find(p => p.providerId === 'github.com');

    if (!provider) {
      return;
    }

    const [appUser] = await core.getAppUserByUid(authUser.uid);

    if (!appUser) {
      return;
    }

    const githubId = Number.parseInt(provider.uid);
    const username = provider.displayName || provider.email;
    const appUserUpdate: Partial<WebAppUser> = { };

    if (appUser.githubId !== githubId) {
      appUserUpdate.githubId = githubId
    }

    if (appUser.username !== username) {
      appUserUpdate.username = username;
    }

    if (Object.keys(appUserUpdate).length > 0) {
      console.log(`update appUser: ${JSON.stringify(appUserUpdate)}`);
      await admin.firestore().doc(`users/${appUser.uid}`).update(appUserUpdate);
    }
  },
  async validateAccountLinkRequirements(authUser: admin.auth.UserRecord): Promise<boolean> {
    const provider = authUser.providerData.find(p => p.providerId === 'github.com');

    return provider !== undefined;
  },
  async getExistingPlatformAccount(userId: string): Promise<Account | undefined> {
    const [appUser] = await core.getAppUserByUid(userId);

    if (!appUser) {
      return;
    }

    if (!appUser.githubId) {
      return;
    }

    const [existingGithubUser] = await getGithubUser(appUser.githubId);

    if (!existingGithubUser) {
      return undefined;
    }

    const [account] = await core.getAccount(existingGithubUser.accountId);

    return account;
  },
  async createNewPlatformAccount(userId: string): Promise<Account | undefined> {
    const [appUser] = await core.getAppUserByUid(userId);

    if (!appUser || !appUser.githubId) {
      return;
    }

    const [githubUser, userError] = await createGithubUser(appUser.githubId);

    if (!githubUser) {
      console.log(`failed to create new platform user: ${(userError as AppError).message}`);
      return undefined;
    }

    const [account] = await core.getAccount(githubUser.accountId);

    return account;
  },
  async onTurtleAccountLinked(userId: string, account: Account, isNewAccount: boolean): Promise<void> {
    if (!isNewAccount) {
      const [appUser] = await core.getAppUserByUid(userId);

      if (!appUser) {
        return;
      }

      // if the platform has an existing account, cancel all unclaimed tips related to that account.
      const tips = await getUnclaimedTips(appUser.githubId);

      if (tips.length > 0) {
        await deleteUnclaimedTips(tips.map(t => t.id));
      }
    }
  }
}

/**
 * Relay Github events to the bot
 */
export const botWebhook = functions.https.onRequest(async (request: Request, response: Response) => {
  await bot.onRequest(request, response);
});

export const marketplaceWebhook = functions.https.onRequest(async (request: Request, response: Response) => {
  console.log(request.body);
  response.status(200).send({status: 'OK'});
});

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
    batch.create(admin.firestore().doc(`platforms/github/users/${githubId}`), githubUser);

    await batch.commit();

    return [githubUser, undefined];
  } catch (error) {
    return [undefined, new AppError('app/create-account', `error creating GithubUser for id: ${githubId}`)];
  }
}

export async function getGithubUser(githubId: number): Promise<[GithubUser | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().doc(`platforms/github/users/${githubId}`).get();

  if (snapshot.exists) {
    return [snapshot.data() as GithubUser, undefined];
  } else {
    return [undefined, new AppError('github/user-not-found')];
  }
}

export async function getWebAppUserByGithubId(githubId: number): Promise<[WebAppUser | undefined, undefined | AppError]> {
  const snapshot = await admin.firestore().collection(`users`)
                    .where('githubId', '==', githubId)
                    .get();

  if (snapshot.size !== 1) {
    return [undefined, new AppError('app/user-no-account')];
  }

  return [snapshot.docs[0].data() as WebAppUser, undefined];
}

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

    await admin.firestore().doc(`platforms/github/unclaimed_tips/${transfer.id}`).set(unclaimedTip);
    return [unclaimedTip, undefined];
  } catch (error) {
    return [undefined, new AppError('app/unclaimed-tip', error)];
  }
}

export const refundUnclaimedTips = functions.pubsub.schedule('every 2 hours').onRun(async (context) => {
  const expiredTips = await getUnclaimedTips(undefined, true);

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

async function getUnclaimedTips(githubId?: number, expired: boolean = false): Promise<UnclaimedTip[]> {
  let query: Query<DocumentData> = admin.firestore().collection('platforms/github/unclaimed_tips');
  const now = Date.now();

  if (githubId) {
    query = query.where('recipientGithubId', '==', githubId);
  }

  if (expired) {
    query = query.where('timeoutDate', '<', now);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((d: any) => d.data() as UnclaimedTip);
}

async function deleteUnclaimedTips(tipIds: string[]): Promise<boolean> {
  try {
    const batch = admin.firestore().batch();

    tipIds.forEach(id => {
      batch.delete(admin.firestore().doc(`platforms/github/unclaimed_tips/${id}`));
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function refundAccountUnclaimedTips(githubId: number, tips: UnclaimedTip[]): Promise<void> {
  // refund tips received by this account, if the account still doesn't have a WebAppUser
  const appUserSnapshot = await admin.firestore().collection('users').where('githubId', '==', githubId).get();

  if (appUserSnapshot.size > 0) {
    // this webAppUser now exists, don't refund tips and delete the unclaimed tip docs
    await deleteUnclaimedTips(tips.map(t => t.id));
    return;
  }

  await Promise.all(tips.map(t => refundUnclaimedTip(t)));
}

async function refundUnclaimedTip(unclaimedTip: UnclaimedTip): Promise<void> {
  console.log(`refund unclaimed tip => id: ${unclaimedTip.id}, timeoutDate: ${unclaimedTip.timeoutDate}, now: ${Date.now()}`);

  const recipientAccountId = unclaimedTip.recipients[0].accountId;

  try {
    const transfer = await admin.firestore().runTransaction(async (txn) => {
      const unclaimedTipRef = admin.firestore().doc(`platforms/github/unclaimed_tips/${unclaimedTip.id}`);
      txn.delete(unclaimedTipRef);

      // send back the original tip
      const [result, transferError] = await TrtlApp.transfer(recipientAccountId, unclaimedTip.senderId, unclaimedTip.recipients[0].amount);

      if (!result) {
        throw (transferError as ServiceError).message;
      }

      return result;
    });

    const promisses: Promise<any>[] = [];

    promisses.push(core.refreshAccount(unclaimedTip.senderId));
    promisses.push(core.refreshAccount(recipientAccountId));

    // create 'tipRefund' transaction doc in original sender's history
    const refundDocRef = admin.firestore().collection(`accounts/${unclaimedTip.senderId}/transactions`).doc();
    const refundTx: Transaction = {
      id:                 refundDocRef.id,
      accountId:          recipientAccountId,
      platform:           'github',
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