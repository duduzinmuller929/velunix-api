import argon2 from 'argon2';
import { randomUUID } from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { setAuthCookies } from '../../utils/cookies';
import { verifyEmailVerificationToken } from '../../utils/email-verification';
import { badRequest, created, internalServerError, notFound, ok, unauthorized } from '../../utils/http';
import { generateUsernameFromEmail } from '../../utils/username';
import {
    EmailAlreadyInUseError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    TokenInvalidorExpiredError,
    UserNotCreatedError,
    UserNotFoundError,
    UserNotFoundLogin,
} from './user.errors';
import { getUserByEmailRepository } from './user.repository';
import {
    changePasswordSchema,
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    updateUserSchema,
    userIdSchema,
    verifyEmailSchema,
} from './user.schemas';
import {
    changePassword,
    deleteExpiredPasswordResetTokens,
    deleteUserService,
    forgotPassword,
    getUserProfile,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerOrLoginOAuthUser,
    registerUserService,
    resetPassword,
    resetPasswordWithToken,
    updateUserService,
    uploadProfilePhoto,
    verifyUserEmail,
} from './user.service';
import type { OAuthCallbackQuery, OAuthProvider } from './user.types';

function getApiBaseUrl() {
    return process.env.API_BASE_URL;
}

export async function redirectOAuthController(provider: OAuthProvider, req: FastifyRequest, reply: FastifyReply) {
    try {
        const apiBaseUrl = getApiBaseUrl();

        if (provider === 'google') {
            const redirectUri = `${apiBaseUrl}/api/users/auth/google/callback`;
            const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
            googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
            googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
            googleAuthUrl.searchParams.set('response_type', 'code');
            googleAuthUrl.searchParams.set('scope', 'openid email profile');
            googleAuthUrl.searchParams.set('access_type', 'offline');
            googleAuthUrl.searchParams.set('prompt', 'consent');

            return reply.redirect(googleAuthUrl.toString());
        }

        if (provider === 'github') {
            const redirectUri = `${apiBaseUrl}/api/users/auth/github/callback`;
            const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
            githubAuthUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID!);
            githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
            githubAuthUrl.searchParams.set('scope', 'user:email read:user');

            return reply.redirect(githubAuthUrl.toString());
        }

        if (provider === 'discord') {
            const redirectUri = `${apiBaseUrl}/api/users/auth/discord/callback`;
            const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
            discordAuthUrl.searchParams.set('client_id', process.env.DISCORD_CLIENT_ID!);
            discordAuthUrl.searchParams.set('redirect_uri', redirectUri);
            discordAuthUrl.searchParams.set('response_type', 'code');
            discordAuthUrl.searchParams.set('scope', 'identify email');
            discordAuthUrl.searchParams.set('prompt', 'consent');

            return reply.redirect(discordAuthUrl.toString());
        }
    } catch (error) {
        req.log.error(error);
        return internalServerError(reply);
    }
}

export async function oauthCallbackController(
    provider: OAuthProvider,
    req: FastifyRequest<{ Querystring: OAuthCallbackQuery }>,
    reply: FastifyReply,
) {
    const { code, error } = req.query;

    if (error) {
        return badRequest(reply, { message: `Erro na autenticação ${provider}`, error });
    }

    if (!code) {
        return badRequest(reply, { message: 'Código de autorização não fornecido' });
    }

    try {
        if (provider === 'google') {
            const redirectUri = `${getApiBaseUrl()}/api/users/auth/google/callback`;

            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: process.env.GOOGLE_CLIENT_ID!,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                }),
            });

            if (!tokenResponse.ok) {
                return internalServerError(reply);
            }

            const tokenData = (await tokenResponse.json()) as { access_token: string };

            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });

            if (!userInfoResponse.ok) {
                return internalServerError(reply);
            }

            const userInfo = (await userInfoResponse.json()) as {
                id: string;
                email: string;
                name: string;
                picture?: string;
            };

            const username = generateUsernameFromEmail(userInfo.email);
            const placeholderPasswordHash = await argon2.hash(
                'oauth-placeholder-' + Math.random().toString(36).substring(2, 15),
            );

            const result = await registerOrLoginOAuthUser(
                {
                    id: userInfo.id,
                    name: userInfo.name,
                    username: username,
                    email: userInfo.email,
                    passwordHash: placeholderPasswordHash,
                    provider: 'GOOGLE',
                    ...(userInfo.picture ? { avatar: userInfo.picture } : {}),
                },
                {
                    name: userInfo.name,
                    email: userInfo.email,
                    avatar: userInfo.picture ?? null,
                },
            );

            if (!result) {
                return internalServerError(reply);
            }
            setAuthCookies(reply, result.accessToken, result.refreshToken);

            return ok(reply, { message: 'Login realizado com sucesso', user: result.user });
        }

        if (provider === 'github') {
            const redirectUri = `${getApiBaseUrl()}/api/users/auth/github/callback`;

            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    client_id: process.env.GITHUB_CLIENT_ID!,
                    client_secret: process.env.GITHUB_CLIENT_SECRET!,
                    code,
                    redirect_uri: redirectUri,
                }),
            });

            if (!tokenResponse.ok) {
                return internalServerError(reply);
            }

            const tokenData = (await tokenResponse.json()) as { access_token: string };

            const userInfoResponse = await fetch('https://api.github.com/user', {
                headers: { Authorization: `token ${tokenData.access_token}` },
            });

            if (!userInfoResponse.ok) {
                return internalServerError(reply);
            }

            const githubUser = (await userInfoResponse.json()) as {
                id: string;
                email: string | null;
                login: string;
                name: string | null;
                avatar_url?: string;
            };

            let email = githubUser.email;
            if (!email) {
                const emailResponse = await fetch('https://api.github.com/user/emails', {
                    headers: { Authorization: `token ${tokenData.access_token}` },
                });

                if (emailResponse.ok) {
                    const emails = (await emailResponse.json()) as Array<{
                        email: string;
                        primary: boolean;
                        verified: boolean;
                    }>;
                    const primaryEmail = emails.find((e) => e.primary && e.verified);
                    email = primaryEmail?.email ?? email;
                }
            }

            if (!email) {
                return badRequest(reply, { message: 'Não foi possível obter o e-mail do GitHub' });
            }

            const username = generateUsernameFromEmail(email);
            const placeholderPasswordHash = await argon2.hash(
                'oauth-placeholder-' + Math.random().toString(36).substring(2, 15),
            );

            const result = await registerOrLoginOAuthUser(
                {
                    id: githubUser.id.toString(),
                    name: githubUser.name ?? githubUser.login,
                    username: username,
                    email: email,
                    passwordHash: placeholderPasswordHash,
                    provider: 'GITHUB',
                    ...(githubUser.avatar_url ? { avatar: githubUser.avatar_url ?? null } : {}),
                },
                {
                    name: githubUser.name ?? githubUser.login,
                    email: email,
                    avatar: githubUser.avatar_url ?? null,
                },
            );

            if (!result) {
                return internalServerError(reply);
            }
            setAuthCookies(reply, result.accessToken, result.refreshToken);

            return ok(reply, { message: 'Login realizado com sucesso', user: result.user });
        }

        if (provider === 'discord') {
            const redirectUri = `${getApiBaseUrl()}/api/users/auth/discord/callback`;

            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.DISCORD_CLIENT_ID!,
                    client_secret: process.env.DISCORD_CLIENT_SECRET!,
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri,
                }),
            });

            if (!tokenResponse.ok) {
                return internalServerError(reply);
            }

            const tokenData = (await tokenResponse.json()) as { access_token: string };

            const userInfoResponse = await fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });

            if (!userInfoResponse.ok) {
                return internalServerError(reply);
            }

            const discordUser = (await userInfoResponse.json()) as {
                id: string;
                email: string;
                username: string;
                global_name?: string;
                avatar?: string;
            };

            const username = generateUsernameFromEmail(discordUser.email);
            const placeholderPasswordHash = await argon2.hash(
                'oauth-placeholder-' + Math.random().toString(36).substring(2, 15),
            );

            const result = await registerOrLoginOAuthUser(
                {
                    id: discordUser.id,
                    name: discordUser.global_name ?? discordUser.username,
                    username: username,
                    email: discordUser.email,
                    passwordHash: placeholderPasswordHash,
                    provider: 'DISCORD',
                    ...(discordUser.avatar
                        ? { avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` }
                        : {}),
                },
                {
                    name: discordUser.global_name ?? discordUser.username,
                    email: discordUser.email,
                    avatar: discordUser.avatar
                        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                        : null,
                },
            );

            if (!result) {
                return internalServerError(reply);
            }
            setAuthCookies(reply, result.accessToken, result.refreshToken);

            return ok(reply, { message: 'Login realizado com sucesso', user: result.user });
        }
        return badRequest(reply, { message: `Provider ${provider} não suportado ainda` });
    } catch (err) {
        console.error(err);
        return internalServerError(reply);
    }
}

export async function createUserController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const params = registerSchema.parse(req.body);

        const userParams = {
            id: randomUUID(),
            ...params,
            createdAt: new Date(),
            provider: 'LOCAL' as const,
        };

        const user = await registerUserService(userParams);

        return created(reply, { message: 'Conta criada com sucesso', user });
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            return badRequest(reply, error.issues[0]?.message);
        }
        if (error instanceof EmailAlreadyInUseError) {
            return badRequest(reply, error.message);
        }
        if (error instanceof UserNotCreatedError) {
            return badRequest(reply, error.message);
        }
        return internalServerError(reply);
    }
}

export async function verifyUserEmailController(
    req: FastifyRequest<{ Querystring: { token: string } }>,
    reply: FastifyReply,
) {
    try {
        const { token } = verifyEmailSchema.parse(req.query);
        const { userId } = verifyEmailVerificationToken(token);

        const user = await verifyUserEmail(userId);

        return ok(reply, { message: 'Email verificado com sucesso', user });
    } catch (error) {
        if (error instanceof TokenInvalidorExpiredError) {
            return badRequest(reply, error.message);
        }
        console.error(error);
        return internalServerError(reply);
    }
}

export async function getUserProfileController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id: userId } = userIdSchema.parse(req.user);
        if (!userId) return unauthorized(reply, { message: 'ID do usuário não encontrado' });

        const user = await getUserProfile(userId);
        if (!user) return notFound(reply, { message: 'Usuário não encontrado.' });

        return { user };
    } catch (error) {
        console.error(error);
        if (error instanceof UserNotFoundError) {
            return badRequest(reply, error.message);
        }
        return internalServerError(reply);
    }
}

export async function loginUserController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const params = loginSchema.parse(req.body);

        const existingUser = await getUserByEmailRepository(params.email);

        if (!existingUser) {
            return unauthorized(reply, { message: 'Usuário não encontrado' });
        }

        const { user, accessToken, refreshToken } = await loginUser(params.email, params.password);

        if (user.emailVerified === false) {
            return unauthorized(reply, { message: 'Email não verificado' });
        }

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

        return ok(reply, {
            message: 'Login realizado com sucesso',
            user,
            accessToken,
            refreshToken,
        });
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            return badRequest(reply, error.issues[0]?.message);
        }
        if (error instanceof InvalidCredentialsError) {
            return badRequest(reply, error.message);
        }
        if (error instanceof UserNotFoundLogin) {
            return badRequest(reply, error.message);
        }
        return internalServerError(reply);
    }
}

export async function logoutUserController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { refresh_token: refreshToken } = req.cookies || {};
        const { id: userId } = userIdSchema.parse(req.user);
        if (!userId) return unauthorized(reply, { message: 'ID do usuário não encontrado' });

        await logoutUser(userId, refreshToken);

        reply.clearCookie('auth_token', { path: '/' });
        reply.clearCookie('refresh_token', { path: '/' });

        return ok(reply, { message: 'Logout realizado com sucesso' });
    } catch (error) {
        console.error(error);
        return internalServerError(reply);
    }
}

export async function refreshAccessTokenController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { refresh_token: refreshToken } = req.cookies || {};
        if (!refreshToken) return unauthorized(reply, { message: 'Token de atualização não encontrado' });

        const user = await refreshAccessToken(refreshToken);
        return ok(reply, { message: 'Token de atualização atualizado com sucesso', user });
    } catch (error) {
        console.error(error);
        return internalServerError(reply);
    }
}

export async function updateUserController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const params = updateUserSchema.parse(req.body);
        const { id } = userIdSchema.parse(req.user);
        if (!id) return unauthorized(reply, { message: 'ID do usuário não encontrado' });

        const user = await updateUserService({ id, ...params });
        return ok(reply, { message: 'Usuário atualizado com sucesso', user });
    } catch (error) {
        console.error(error);
        return internalServerError(reply);
    }
}

export async function deleteUserController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { refresh_token: refreshToken } = req.cookies || {};
        const { id } = userIdSchema.parse(req.user);
        if (!id) return unauthorized(reply, { message: 'ID do usuário não encontrado' });

        await deleteUserService(id, refreshToken);

        return ok(reply, { message: 'Usuário deletado com sucesso' });
    } catch (error) {
        console.error(error);
        return internalServerError(reply);
    }
}

export async function uploadProfilePhotoController(req: FastifyRequest, reply: FastifyReply) {
    const { id } = userIdSchema.parse(req.user);
    try {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
            const body = req.body as { avatar?: string };

            if (!body.avatar) {
                return reply.status(400).send({
                    message: 'profile_photo_url é obrigatório quando enviado via JSON',
                });
            }

            try {
                new URL(body.avatar);
            } catch {
                return badRequest(reply, {
                    message: 'profile_photo_url deve ser uma URL válida',
                });
            }

            await updateUserService({
                id,
                avatar: body.avatar,
            });

            return ok(reply, {
                message: 'Foto de perfil atualizada com sucesso',
                avatar: body.avatar,
            });
        }

        const data = await req.file();
        if (!data) {
            return badRequest(reply, { message: 'Nenhum arquivo enviado' });
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(data.mimetype)) {
            return reply.status(400).send({
                message: 'Tipo de arquivo não permitido. Use JPG, PNG ou WEBP',
            });
        }

        const buffer = await data.toBuffer();

        const result = await uploadProfilePhoto(id, buffer, data.filename);

        return ok(reply, {
            message: 'Foto de perfil enviada com sucesso',
            profile_photo_url: result.profile_photo_url,
            file_key: result.file_key,
        });
    } catch (error) {
        console.error(error);
        return internalServerError(reply);
    }
}

export async function resetPasswordController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { email, newPassword } = req.body as { email: string; newPassword: string };

        if (!email || !newPassword) {
            return badRequest(reply, { message: 'Email e nova senha são obrigatórios' });
        }

        await resetPassword(email, newPassword);

        return ok(reply, { message: 'Senha redefinida com sucesso' });
    } catch (error) {
        console.error(error);
        if (error instanceof UserNotFoundError) {
            return ok(reply, { message: 'Se o email existir, você receberá instruções para redefinir sua senha' });
        }
        return internalServerError(reply);
    }
}

export async function forgotPasswordController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);

        await forgotPassword(email);

        return ok(reply, { message: 'Se o email existir, você receberá instruções para redefinir sua senha' });
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            return badRequest(reply, error.issues[0]?.message);
        }
        return internalServerError(reply);
    }
}

export async function resetPasswordWithTokenController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const params = resetPasswordSchema.parse(req.body);
        const { token, password } = params;

        await resetPasswordWithToken(token, password);

        return ok(reply, { message: 'Senha redefinida com sucesso' });
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            return badRequest(reply, error.issues[0]?.message);
        }
        if (error instanceof InvalidRefreshTokenError) {
            return badRequest(reply, { message: 'Token inválido ou expirado' });
        }
        return internalServerError(reply);
    }
}

export async function changePasswordController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id: userId } = userIdSchema.parse(req.user);
        if (!userId) return unauthorized(reply, { message: 'ID do usuário não encontrado' });

        const params = changePasswordSchema.parse(req.body);
        const { currentPassword, newPassword } = params;

        await changePassword(userId, currentPassword, newPassword);

        return ok(reply, { message: 'Senha alterada com sucesso' });
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            return badRequest(reply, error.issues[0]?.message);
        }
        if (error instanceof UserNotFoundError) {
            return badRequest(reply, error.message);
        }
        if (error instanceof InvalidCredentialsError) {
            return badRequest(reply, error.message);
        }
        return internalServerError(reply);
    }
}

export async function deleteExpiredPasswordResetTokensController(req: FastifyRequest, reply: FastifyReply) {
    try {
        await deleteExpiredPasswordResetTokens();

        return ok(reply, { message: 'Tokens expirados removidos com sucesso' });
    } catch (error) {
        console.error(error);
        return internalServerError(reply);
    }
}
