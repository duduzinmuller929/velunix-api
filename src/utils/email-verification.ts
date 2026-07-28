import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;

export function generateEmailVerificationToken(userId: string) {
    return jwt.sign({ userId }, SECRET, { expiresIn: '1h' });
}

export function verifyEmailVerificationToken(token: string): { userId: string } {
    return jwt.verify(token, SECRET) as { userId: string };
}
