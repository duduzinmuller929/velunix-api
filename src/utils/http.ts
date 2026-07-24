import type { FastifyReply } from 'fastify';

export function unauthorized<T>(reply: FastifyReply, data: T) {
    return reply.status(401).send(data);
}

export function notFound<T>(reply: FastifyReply, data: T) {
    return reply.status(404).send(data);
}

export function created<T>(reply: FastifyReply, data: T) {
    return reply.status(201).send(data);
}

export function ok<T>(reply: FastifyReply, data: T) {
    return reply.status(200).send(data);
}

export function badRequest<T>(reply: FastifyReply, data: T) {
    return reply.status(400).send(data);
}

export function internalServerError(reply: FastifyReply) {
    return reply.status(500).send({ message: 'Erro interno do servidor.' });
}
