import { Application } from 'probot'
import Webhooks from '@octokit/webhooks';
import { TipCommandInfo } from '../types';

export function initListeners(bot: Application) {
  bot.on('issue_comment.created', async context => {
  // const params = context.issue({ body: 'Hello World!' })

  if (context.payload.action !== 'created') {
    return;
  }

  // check for tip command in comment body
  const commentText = context.payload.comment.body

  if (!commentText.startsWith('.tip ')) {
    return;
  }

  const senderId = context.payload.sender.id;
  const sendedLogin = context.payload.sender.login;
  const senderUrl = context.payload.sender.url;

  console.log(`comment created by: ${sendedLogin}, id: ${senderId}, sender url: ${senderUrl}`);

  const commandInfo = getTipCommandInfo(context.payload.comment);

  if (!commandInfo) {
    console.log('invalid tip command.');
    const params = context.issue({ body: 'Invalid tip command' })
    await context.github.issues.createComment(params);

    return;
  }

  console.log(`proccess tip command: ${JSON.stringify(commandInfo)}`);

  // Post a comment on the issue
  // await context.github.issues.createComment(params)
  });
}

function getTipCommandInfo(comment: Webhooks.WebhookPayloadIssueCommentComment): TipCommandInfo | undefined {
  const mentions = getMentions(comment.body);

  if (mentions.length === 0) {
    return undefined;
  }

  const amount = getTipAmount(comment.body);

  if (!amount) {
    return undefined;
  }

  const tipInfo: TipCommandInfo = {
    senderGithubId: comment.user.id,
    amount: amount,
    recipientNames: mentions
  };

  return tipInfo;
}

function getTipAmount(text: string): number | undefined {
  const words = text.split(' ');

  if (words.length < 2) {
    return undefined;
  }

  // get 2nd word in text
  const amount = parseFloat(words[1]);

  if (amount === NaN) {
    return undefined;
  }

  return amount;
}

function getMentions(text: string): string[] {
  const mentionPattern = /\B@[a-z0-9_-]+/gi;
  const mentionsList = text.match(mentionPattern);

  if (!mentionsList) {
    return [];
  }

  return mentionsList.map((user: any) => user.substring(1));
}
