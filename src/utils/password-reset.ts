import crypto from 'crypto';

export function generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
}
