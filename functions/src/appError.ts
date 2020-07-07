export type AppErrorCode =  'app/unknown-error'           |
                            'app/user-not-found'          |
                            'app/user-no-account'         |
                            'app/create-account'          |
                            'app/tip-error'               |
                            'github/user-not-found'


export class AppError {
  public readonly errorCode: AppErrorCode;
  public readonly message: string;

  constructor(errorCode: AppErrorCode, customMessage?: string) {
    this.errorCode = errorCode;

    if (customMessage) {
      this.message = customMessage;
    } else {
      this.message = this.getErrorMessage(errorCode);
    }
  }

  getErrorMessage(errorCode: AppErrorCode): string {
    switch (errorCode) {
      case 'app/user-not-found':
        return 'User not found.';
      case 'app/user-no-account':
        return 'User does not have an account.';
      case 'app/create-account':
        return 'An error occured creating app account.';
      case 'app/tip-error':
        return 'An error occured while sending tip.';
      case 'github/user-not-found':
        return 'Failed to find github user.';
      default:
        return 'An unknown error has occured.';
    }
  }
}
