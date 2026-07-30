import type { FastifyReply } from 'fastify';

export function setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
    reply.setCookie('auth_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        path: '/',
        maxAge: 60 * 15,
    });
    reply.setCookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
    });
}
