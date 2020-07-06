import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin';
import { Request, Response } from 'express';
import { createProbot, Options } from 'probot'

const probotEnv = functions.config().probot;

// // Check if we are in Firebase or in development
// if(!probotConfig) {
//   // Use dev config
//   probotConfig = require('../private/env.json');
// }

// Init Firebase
initializeApp();

const probotConfig: Options = {
  id: probotEnv.app_id,
  secret: probotEnv.webhook_secret,
  cert: probotEnv.private_key.replace(/\\n/g, '\n'),
}

// Create the bot using Firebase's probot config (see Readme.md)
const bot = createProbot(probotConfig);

// // disable probot logging
// bot.logger.streams.splice(0, 1);
// // Use node console as the output stream
// bot.logger.addStream(consoleStream(store));
// // Load the merge task to monitor PRs
bot.load(robot => {
  robot.on('issues.opened', async context => {
    const params = context.issue({ body: 'Hello World!' })

    // Post a comment on the issue
    await context.github.issues.createComment(params)
  });

  robot.on('issue_comment.created', async context => {
    // const params = context.issue({ body: 'Hello World!' })

    // TODO: filter for 'created' action
    // context.payload.action

    // TODO: check for tip command in comment body
    // context.payload.comment.body

    const senderId = context.payload.sender.id;
    const sendedLogin = context.payload.sender.login;
    const senderUrl = context.payload.sender.url;

    console.log(`comment created by: ${sendedLogin}, id: ${senderId}, sender url: ${senderUrl}`);

    // Post a comment on the issue
    // await context.github.issues.createComment(params)
  });

  // tasks = registerTasks(robot, store);
});

/**
 * Relay Github events to the bot
 */
exports.bot = functions.https.onRequest(async (request: Request, response: Response) => {
  const name = request.get('x-github-event') || request.get('X-GitHub-Event');
  const id = request.get('x-github-delivery') || request.get('X-GitHub-Delivery');

  // console.log(`name: ${name}, id: ${id}`);
  // response.status(200).send('OK');

  if(name && id) {
    try {
      await bot.receive({
        name,
        id,
        payload: request.body,
        protocol: 'https',
        host: request.hostname,
        url: request.url
      });
      response.send({
        statusCode: 200,
        body: JSON.stringify({
          message: 'Executed'
        })
      });
    } catch(err) {
      console.error(err);
      response.sendStatus(500);
    }
  } else {
    console.error(request);
    response.sendStatus(400);
  }
});
