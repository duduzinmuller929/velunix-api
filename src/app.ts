import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import dbPlugin from './plugins/db.js';

const app = Fastify({
    logger: true,
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(fastifyCors, {
    origin: true,
});

await app.register(fastifyCookie, {
    secret: 'velunix-secret-key',
});

await app.register(dbPlugin);

await app.register(swagger, {
    openapi: {
        info: {
            title: 'Velunix API',
            description: 'Documentação da API',
            version: '1.0.0',
        },
    },
});

await app.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
    },
});

app.get('/', async function (request: FastifyRequest, reply: FastifyReply) {
    return reply.send({ hello: 'world' });
});

async function start() {
    try {
        if (!app.addresses().length) {
            await app.listen({ port: 8000 });
        }
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();

export default app;
