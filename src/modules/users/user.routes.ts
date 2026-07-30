import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';

import { authMiddleware } from '../../middleware/auth';
import {
    changePasswordController,
    createUserController,
    deleteExpiredPasswordResetTokensController,
    deleteUserController,
    forgotPasswordController,
    getUserProfileController,
    hardDeleteUserController,
    loginUserController,
    logoutUserController,
    oauthCallbackController,
    redirectOAuthController,
    refreshAccessTokenController,
    resetPasswordController,
    resetPasswordWithTokenController,
    updateUserController,
    uploadProfilePhotoController,
    verifyUserEmailController,
} from './user.controller';
import {
    changePasswordSchema,
    forgotPasswordSchema,
    loginSchema,
    refreshTokenSchema,
    registerSchema,
    resetPasswordSchema,
    updateUserSchema,
    verifyEmailSchema,
} from './user.schemas';
import type { OAuthCallbackQuery } from './user.types';

export async function userRoutes(app: FastifyInstance) {
    app.post(
        '/users/register',
        {
            schema: {
                summary: 'Criar um novo Usuário',
                tags: ['Usuarios'],
                body: registerSchema,
                response: {
                    201: z.object({
                        message: z.string(),
                        user: z.object({
                            id: z.string(),
                            username: z.string(),
                            name: z.string(),
                            email: z.string(),
                            passwordHash: z.string(),
                        }),
                    }),
                    400: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
        createUserController,
    );
    app.get(
        '/users/auth/google',
        {
            schema: {
                summary: 'Redireciona para a página de autenticação do Google',
                tags: ['Usuários'],
            },
        },
        (req: FastifyRequest, reply: FastifyReply) => redirectOAuthController('google', req, reply),
    );
    app.get(
        '/users/auth/github',
        {
            schema: {
                summary: 'Redireciona para a página de autenticação do Github',
                tags: ['Usuários'],
            },
        },
        (req: FastifyRequest, reply: FastifyReply) => redirectOAuthController('github', req, reply),
    );
    app.get(
        '/users/auth/discord',
        {
            schema: {
                summary: 'Redireciona para a página de autenticação do Discord',
                tags: ['Usuários'],
            },
        },
        (req: FastifyRequest, reply: FastifyReply) => redirectOAuthController('discord', req, reply),
    );
    app.get(
        '/users/auth/google/callback',
        {
            schema: {
                summary: 'Callback da autenticação do Google',
                tags: ['Usuários'],
            },
        },
        (req: FastifyRequest<{ Querystring: OAuthCallbackQuery }>, reply: FastifyReply) =>
            oauthCallbackController('google', req, reply),
    );
    app.get(
        '/users/auth/github/callback',
        {
            schema: {
                summary: 'Callback da autenticação do Github',
                tags: ['Usuários'],
            },
        },
        (req: FastifyRequest<{ Querystring: OAuthCallbackQuery }>, reply: FastifyReply) =>
            oauthCallbackController('github', req, reply),
    );
    app.get(
        '/users/auth/discord/callback',
        {
            schema: {
                summary: 'Callback da autenticação do Discord',
                tags: ['Usuários'],
            },
        },
        (req: FastifyRequest<{ Querystring: OAuthCallbackQuery }>, reply: FastifyReply) =>
            oauthCallbackController('discord', req, reply),
    );
    app.get(
        '/users/me',
        {
            preHandler: authMiddleware,
            schema: {
                summary: 'Obter perfil do usuário autenticado',
                tags: ['Usuários'],
            },
        },
        (req: FastifyRequest, reply: FastifyReply) => getUserProfileController(req, reply),
    );
    app.post(
        '/users/login',
        {
            schema: {
                summary: 'Login do usuário',
                tags: ['Usuários'],
                body: loginSchema,
            },
        },
        loginUserController,
    );
    app.delete(
        '/users/logout',
        {
            preHandler: authMiddleware,
            schema: {
                summary: 'Logout do usuário',
                tags: ['Usuários'],
            },
        },
        logoutUserController,
    );
    app.post(
        '/users/refresh',
        {
            schema: {
                summary: 'Atualizar token de acesso',
                tags: ['Usuários'],
                body: refreshTokenSchema,
                response: {
                    200: z.object({
                        message: z.string(),
                    }),
                    401: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
        refreshAccessTokenController,
    );
    app.get(
        '/users/verify-email',
        {
            schema: {
                summary: 'Verificar e-mail do usuário',
                tags: ['Usuários'],
                querystring: verifyEmailSchema,
            },
        },
        verifyUserEmailController,
    );
    app.put(
        '/users/update',
        {
            preHandler: authMiddleware,
            schema: {
                summary: 'Atualizar dados do usuário',
                tags: ['Usuários'],
                body: updateUserSchema,
            },
        },
        updateUserController,
    );
    app.delete(
        '/users/delete',
        {
            preHandler: authMiddleware,
            schema: {
                summary: 'Desativar usuário (soft delete)',
                tags: ['Usuários'],
            },
        },
        deleteUserController,
    );
    app.delete(
        '/users/hard-delete',
        {
            preHandler: authMiddleware,
            schema: {
                summary: 'Excluir usuário permanentemente',
                tags: ['Usuários'],
            },
        },
        hardDeleteUserController,
    );

    app.post(
        '/users/upload-profile-photo',
        {
            preHandler: authMiddleware,
            schema: {
                summary: 'Upload de foto de perfil',
                tags: ['Usuários'],
            },
        },
        uploadProfilePhotoController,
    );

    app.post(
        '/users/reset-password',
        {
            schema: {
                summary: 'Redefinir senha do usuário',
                tags: ['Usuários'],
            },
        },
        resetPasswordController,
    );

    app.post(
        '/users/forgot-password',
        {
            schema: {
                summary: 'Esqueci minha senha',
                tags: ['Usuários'],
                body: forgotPasswordSchema,
            },
        },
        forgotPasswordController,
    );

    app.post(
        '/users/reset-password-with-token',
        {
            schema: {
                summary: 'Redefinir senha com token',
                tags: ['Usuários'],
                body: resetPasswordSchema,
            },
        },
        resetPasswordWithTokenController,
    );

    app.post(
        '/users/change-password',
        {
            preHandler: authMiddleware,
            schema: {
                summary: 'Alterar senha do usuário',
                tags: ['Usuários'],
                body: changePasswordSchema,
            },
        },
        changePasswordController,
    );

    app.post(
        '/users/delete-expired-password-reset-tokens',
        {
            schema: {
                summary: 'Excluir tokens de redefinição de senha expirados',
                tags: ['Usuários'],
            },
        },
        deleteExpiredPasswordResetTokensController,
    );
}
