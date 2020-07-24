import { Transfer } from 'trtl-apps';

export interface Config {
  githubTipTimeoutDays: number    // amount of days before unclaimed tips are refunded. < 1 days means no timeout
}

export interface WebAppUser {
  uid: string;
  githubId: number;
  accountId?: string;
  username: string;
}

export interface GithubUser {
  githubId: number;
  accountId: string;
}

export interface TipCommandInfo {
  senderUsername: string;
  senderGithubId: number;
  amount: number;
  recipientUsername: string;
}

export interface UnclaimedTip extends Transfer {
  timeoutDays: number;
  timeoutDate: number;
  recipientGithubId: number;
  recipientUsername: string;
  senderUsername: string;
}

export type Platform = 'github';

export type TransactionType = 'deposit' | 'withdrawal' | 'tip' | 'tipRefund';
export type TransactionStatus = 'confirming' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  userId?: string;
  accountId: string;
  platform?: Platform;
  githubId?: number,
  timestamp: number;
  transferType: TransactionType;
  amount: number;
  fee: number;
  status: TransactionStatus;
  sendAddress?: string;
  depositId?: string;
  withdrawalId?: string;
  accountTransferId?: string;
  txHash?: string;
  paymentId?: string;
  senderUsername?: string;
  recipientUsername?: string;
}