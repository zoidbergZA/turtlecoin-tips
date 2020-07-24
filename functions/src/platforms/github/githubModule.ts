import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Request, Response } from 'express';
import { AppUser } from '../../types';
import { AppError } from '../../appError';
import * as db from '../../database';
import * as bot from './bot';

/**
 * Relay Github events to the bot
 */
export const botWebhook = functions.https.onRequest(async (request: Request, response: Response) => {
  await bot.onRequest(request, response);
});

export async function onNewGithubUser(user: admin.auth.UserRecord): Promise<void> {
  const provider = user.providerData.find(p => p.providerId === 'github');

  if (!provider) {
    console.log(`invalid github provider: ${JSON.stringify(user.providerData)}, deleting auth user [${user.uid}]...`);
    return;
  }

  let username = provider.displayName || provider.email;

  if (!username) {
    username = 'new user';
  }

  const appUser: AppUser = {
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