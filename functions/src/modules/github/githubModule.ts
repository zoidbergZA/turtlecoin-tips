import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as db from '../../database';
import * as bot from './bot/bot';
import groupBy from 'lodash.groupby';
import { Request, Response } from 'express';
import { AppError } from '../../appError';
import { WebAppUser, UnclaimedTip, Transaction } from '../../types';
import { TrtlApp, ServiceError } from 'trtl-apps';

/**
 * Relay Github events to the bot
 */
export const botWebhook = functions.https.onRequest(async (request: Request, response: Response) => {
  await bot.onRequest(request, response);
});

export async function onNewGithubUser(user: admin.auth.UserRecord): Promise<void> {
  const provider = user.providerData.find(p => p.providerId === 'github.com');

  if (!provider) {
    console.log(`invalid github provider: ${JSON.stringify(user.providerData)}, deleting auth user [${user.uid}]...`);
    return;
  }

  let username = provider.displayName || provider.email;

  if (!username) {
    username = 'new user';
  }

  const appUser: WebAppUser = {
    uid: user.uid,
    username: username,
    githubId: Number.parseInt(provider.uid)
  }

  try {
    await admin.firestore().doc(`users/${appUser.uid}`).set(appUser);
  } catch (error) {
    console.log(error);
    console.log('aborting new user creation!');
    return;
  }

  const [existingGithubUser] = await db.getGithubUser(appUser.githubId);

  if (existingGithubUser) {
    appUser.accountId = existingGithubUser.accountId;

    await admin.firestore().doc(`users/${appUser.uid}`).update({
      accountId: existingGithubUser.accountId
    });

    console.log(`associated account [${existingGithubUser.accountId}] with app user [${appUser.uid}].`);

    // if the new user already has a tips account, cancel all unclaimed tips.
    const tips = await db.getUnclaimedTips(appUser.githubId);

    if (tips.length > 0) {
      await db.deleteUnclaimedTips(tips.map(t => t.id));
    }
  } else {
    const [githubUser, userError] = await db.createGithubUser(appUser.githubId);

    if (githubUser) {
      await admin.firestore().doc(`users/${appUser.uid}`).update({
        accountId: githubUser.accountId
      });

      console.log(`associated account [${githubUser.accountId}] with user [${appUser.uid}].`);
    } else {
      console.log(`error creating account for app user [${appUser.uid}]: ${(userError as AppError).message}`);
    }
  }
}

export const refundUnclaimedTips = functions.pubsub.schedule('every 2 hours').onRun(async (context) => {
  const expiredTips = await db.getUnclaimedTips(undefined, true);

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

async function refundAccountUnclaimedTips(githubId: number, tips: UnclaimedTip[]): Promise<void> {
  // refund tips received by this account, if that account still doesn't have an AppUser
  const appUserSnapshot = await admin.firestore().collection('users').where('githubId', '==', githubId).get();

  if (appUserSnapshot.size > 0) {
    // this appUser now exists, don't refund tips and delete the unclaimed tip docs
    await db.deleteUnclaimedTips(tips.map(t => t.id));
    return;
  }

  await Promise.all(tips.map(t => refundUnclaimedTip(t)));
}

async function refundUnclaimedTip(unclaimedTip: UnclaimedTip): Promise<void> {
  console.log(`refund unclaimed tip => id: ${unclaimedTip.id}, timeoutDate: ${unclaimedTip.timeoutDate}, now: ${Date.now()}`);

  const recipientAccountId = unclaimedTip.recipients[0].accountId;

  try {
    const transfer = await admin.firestore().runTransaction(async (txn) => {
      const unclaimedTipRef = admin.firestore().doc(`unclaimed_tips/${unclaimedTip.id}`);
      txn.delete(unclaimedTipRef);

      // send back the original tip
      const [result, transferError] = await TrtlApp.transfer(recipientAccountId, unclaimedTip.senderId, unclaimedTip.recipients[0].amount);

      if (!result) {
        throw (transferError as ServiceError).message;
      }

      return result;
    });

    const promisses: Promise<any>[] = [];

    promisses.push(db.refreshAccount(unclaimedTip.senderId));
    promisses.push(db.refreshAccount(recipientAccountId));

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