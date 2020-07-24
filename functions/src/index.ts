import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as webAppModule from './modules/webAppModule';
import * as githubModule from './modules/github/githubModule';
import { TrtlApp } from 'trtl-apps';

const turtleConfig = functions.config().trtl;

// Init Firebase
admin.initializeApp();

// Init TRTL App
TrtlApp.initialize(turtleConfig.app_id, turtleConfig.app_secret);

export const webApp = webAppModule;
export const github = githubModule;
export { webhook as trtlAppsWebhook } from './modules/trtlAppsWebhook';
