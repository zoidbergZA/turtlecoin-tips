import { Transfer } from 'trtl-apps';

export interface AppConfig {
  tipTimeoutDays: number    // amount of days before unclaimed tips are refunded. < 1 days means no timeout
}

export interface AppUser {
  uid: string;
  githubId?: number;
  username?: string;
}

export interface TipCommandInfo {
  senderUsername: string;
  senderGithubId: number;
  amount: number;
  recipientNames: string[];
}

export interface UnclaimedTip extends Transfer {
  timeoutDays: number;
  timeoutDate: number;
  recipientGithubId: number;
}