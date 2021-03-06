import { admin } from 'firebase-admin/lib/auth';
import { Transfer, Account } from 'trtl-apps';

export interface Config {
  githubTipTimeoutDays: number    // amount of days before unclaimed tips are refunded. < 1 days means no timeout
}

export interface ITurtleAccountLinker {
  accountProvider: AccountProvider;
  updateAppUserPlatformData: (authUser: admin.auth.UserRecord) => Promise<void>,
  validateAccountLinkRequirements: (authUser: admin.auth.UserRecord) => Promise<boolean>,
  getExistingPlatformAccount: (userId: string) => Promise<Account | undefined>,
  createNewPlatformAccount: (userId: string) => Promise<Account | undefined>,
  onTurtleAccountLinked?: (userId: string, account: Account, isNewAccount: boolean) => Promise<void>
}

export interface WebAppUser {
  uid: string;
  primaryAccountId?: string;
  githubId?: number;
  email?: string;
  emailVerified: boolean;
  username: string;
  disclaimerAccepted: boolean;
}

export interface GithubUser {
  githubId: number;
  accountId: string;
}

export interface EmailUser {
  email: string;
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

export type AccountProvider = 'password' | 'github.com';
export type Platform = 'webapp' | 'github';
export type TransactionType = 'deposit' | 'withdrawal' | 'tip' | 'tipRefund';
export type TransactionStatus = 'confirming' | 'completed' | 'failed';

export interface LinkedTurtleAccount {
  provider: AccountProvider;
  accountId: string;
  userId: string;
  primary: boolean;
  balanceUnlocked: number;
}

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