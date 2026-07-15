export class UserSetupError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UserSetupError';
    }
}

export class UserNotFoundError extends Error {
    readonly code = 'USER_NOT_FOUND' as const;
    constructor(readonly userId: string) {
        super(`User not found: ${userId}`);
        this.name = 'UserNotFoundError';
    }
}
