import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { TrtlApp } from 'trtl-apps';

const turtleConfig = functions.config().trtl;

// Init Firebase
admin.initializeApp();

// Init TRTL App
TrtlApp.initialize(turtleConfig.app_id, turtleConfig.app_secret);

export * as webApp from './modules/webAppModule';
export * as github from './modules/github/githubModule';
export { webhook as trtlAppsWebhook } from './modules/trtlAppsWebhook';
