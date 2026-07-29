export class UserNotFoundError extends Error {
    readonly code = 'USER_NOT_FOUND' as const;
    constructor(readonly userId: string) {
        super(`User not found: ${userId}`);
        this.name = 'UserNotFoundError';
    }
}

export class UserNotFoundLogin extends Error {
    constructor() {
        super(`User not found`);
        this.name = 'UserNotFoundError';
    }
}

export class EmailAlreadyInUseError extends Error {
    constructor(readonly email: string) {
        super(`O email ${email} ja esta em uso`);
        this.name = 'EmailAlreadyInUseError';
    }
}

export class UserNotCreatedError extends Error {
    constructor() {
        super(`User not created`);
        this.name = 'UserNotCreatedError';
    }
}

export class InvalidCredentialsError extends Error {
    constructor() {
        super(`Invalid credentials`);
        this.name = 'InvalidCredentialsError';
    }
}

export class InvalidRefreshTokenError extends Error {
    constructor() {
        super(`Invalid or expired refresh token`);
        this.name = 'InvalidRefreshTokenError';
    }
}

export class UserNotUpdatedError extends Error {
    constructor(readonly userId: string) {
        super(`User not updated: ${userId}`);
        this.name = 'UserNotUpdatedError';
    }
}

export class UserProfilePhotoError extends Error {
    constructor() {
        super(`Error updating user profile photo`);
        this.name = 'UserProfilePhotoError';
    }
}

export class FreePlanAssignmentError extends Error {
    constructor() {
        super('Error assigning free plan to user');
        this.name = 'FreePlanAssignmentError';
    }
}

export class TokenInvalidorExpiredError extends Error {
    constructor() {
        super('Token inválido ou expirado');
        this.name = 'TokenInvalidorExpiredError';
    }
}
