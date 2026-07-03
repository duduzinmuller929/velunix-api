import fp from 'fastify-plugin';

import { prisma } from './prisma';

export default fp(async (fastify) => {
    fastify.decorate('db', prisma);
});

declare module 'fastify' {
    interface FastifyInstance {
        db: typeof prisma;
    }
}
