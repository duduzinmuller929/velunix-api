import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import Fastify from 'fastify';
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import dbPlugin from './plugins/db';

export const buildApp = async () => {
    const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(swagger, {
        openapi: {
            info: {
                title: 'ScrollFeed API',
                description: 'Documentação automática da API',
                version: '1.0.0',
            },
            servers: [{ url: `http://localhost:${process.env.PORT}` }],
        },
        transform: jsonSchemaTransform,
        hideUntagged: false,
    });

    await app.register(dbPlugin);
    await app.register(fastifyMultipart, {
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    });
    app.register(fastifyCookie, {
        secret: process.env.JWT_SECRET!,
    });

    await app.register(swaggerUI, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false,
        },
    });

    await app.register(fastifyCors, {
        origin: true,
        credentials: true,
    });

    app.get(
        '/health',
        {
            schema: {
                summary: 'Health check da API',
                tags: ['Rota de health check'],
            },
        },
        async () => {
            return { message: 'Hello world API FUNCIONANDO' };
        },
    );

    return app;
};
