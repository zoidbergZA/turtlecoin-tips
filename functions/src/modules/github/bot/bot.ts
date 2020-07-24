import * as functions from 'firebase-functions';
import * as SendTipCommand from './sendTip';
import { Request, Response } from 'express';
import { createProbot, Options } from 'probot'

const probotConfig = functions.config().probot;

const probotOptions: Options = {
  id:     probotConfig.app_id,
  secret: probotConfig.webhook_secret,
  cert:   probotConfig.private_key.replace(/\\n/g, '\n'),
}

const bot = createProbot(probotOptions);

bot.load(robot => {
  SendTipCommand.initListeners(robot);
});

export async function onRequest(request: Request, response: Response) {
  const name = request.get('x-github-event') || request.get('X-GitHub-Event');
  const id = request.get('x-github-delivery') || request.get('X-GitHub-Delivery');

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
}
