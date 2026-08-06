import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import Fastify, { type FastifyError } from 'fastify';
import {
    hasZodFastifySchemaValidationErrors,
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { couponRoutes } from './modules/coupons/coupon.routes';
import { userRoutes } from './modules/users/user.routes';
import dbPlugin from './plugins/db';

export const buildApp = async () => {
    const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    app.setErrorHandler<FastifyError>((error, _request, reply) => {
        if (hasZodFastifySchemaValidationErrors(error)) {
            const message = error.validation[0]?.message ?? 'Dados inválidos fornecidos';
            return reply.status(400).send({ message });
        }

        const statusCode = error.statusCode ?? 500;

        if (statusCode >= 500) {
            return reply.status(statusCode).send({ message: 'Erro interno do servidor.' });
        }

        return reply.status(statusCode).send({ message: error.message });
    });

    await app.register(swagger, {
        openapi: {
            info: {
                title: 'Velunix API',
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

    await app.register(userRoutes, { prefix: '/api' });
    await app.register(couponRoutes, { prefix: '/api' });

    return app;
};
