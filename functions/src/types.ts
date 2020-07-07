export interface AppUser {
  uid: string;
  githubId?: number;
}

export interface TipCommandInfo {
  senderUsername: string;
  senderGithubId: number;
  amount: number;
  recipientNames: string[];
}