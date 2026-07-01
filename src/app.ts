import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
const app = Fastify({
    logger: true,
});

app.get('/', async function handler(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ hello: 'world' });
});

async function start() {
    try {
        await app.listen({ port: 8000 });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();

export default app;
