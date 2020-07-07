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