import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

import { getUserByIdRepository } from '../modules/users/user.repository';
import { notFound, unauthorized } from '../utils/http';

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
    try {
        const token = req.cookies?.auth_token;
        if (!token) return unauthorized(reply, { message: 'No token' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const user = await getUserByIdRepository(decoded.id);
        if (!user) return notFound(reply, { message: 'Usuário não encontrado' });

        req.user = { id: user.id };
    } catch {
        return unauthorized(reply, { message: 'Invalid token' });
    }
}

declare module 'fastify' {
    interface FastifyRequest {
        user: { id: string };
    }
}
