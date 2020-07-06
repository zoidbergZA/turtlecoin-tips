export interface AppUser {
  uid: string;
  githubId?: string;
}

export interface TipCommandInfo {
  senderGithubId: number;
  amount: number;
  recipientNames: string[];
}