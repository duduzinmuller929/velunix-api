import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import crypto from 'crypto';

import type { Prisma } from '../../../prisma/generated/client';
import { UserRole } from '../../../prisma/generated/enums';
import { prisma } from '../../plugins/prisma';
import { UserNotFoundError } from './user.errors';
import type { CreateUserData, RefreshTokenType } from './user.types';

const FREE_SUBSCRIPTION_EXPIRES_AT = new Date('2099-12-31T23:59:59.000Z');

export async function createUserRepository(createUserData: CreateUserData, freePlanId: string) {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name: createUserData.name,
                username: createUserData.username,
                email: createUserData.email,
                avatar: createUserData.avatar ?? null,
                phone: createUserData.phone ?? null,
                passwordHash: createUserData.passwordHash,
                role: createUserData.roleId
                    ? { connect: { id: createUserData.roleId } }
                    : { connect: { name: UserRole.USER } },
                provider: 'LOCAL',
            },
        });

        await tx.subscription.create({
            data: {
                userId: user.id,
                planId: freePlanId,
                expiresAt: FREE_SUBSCRIPTION_EXPIRES_AT,
                renewalDate: FREE_SUBSCRIPTION_EXPIRES_AT,
            },
        });

        await tx.profile.create({
            data: {
                userId: user.id,
                language: 'PT',
                timezone: 'UTC',
                theme: 'SYSTEM',
                aiName: 'Velunix AI',
            },
        });

        await tx.userSettings.create({
            data: {
                userId: user.id,
                language: 'PT',
                timezone: 'UTC',
                theme: 'SYSTEM',
                notifications: true,
                aiMode: 'GENERATIVE',
            },
        });

        await tx.organization.create({
            data: {
                ownerId: user.id,
                name: `${user.name}'s Workspace`,
            },
        });

        return user;
    });
}

export async function createUserAuthProvider(createUserAuthProviderParams: CreateUserData, freePlanId: string) {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name: createUserAuthProviderParams.name,
                username: createUserAuthProviderParams.username,
                email: createUserAuthProviderParams.email,
                avatar: createUserAuthProviderParams.avatar ?? null,
                phone: createUserAuthProviderParams.phone ?? null,
                passwordHash: createUserAuthProviderParams.passwordHash,
                provider: createUserAuthProviderParams.provider,
                emailVerified: true,
                role: createUserAuthProviderParams.roleId
                    ? { connect: { id: createUserAuthProviderParams.roleId } }
                    : { connect: { name: UserRole.USER } },
            },
        });

        await tx.subscription.create({
            data: {
                userId: user.id,
                planId: freePlanId,
                expiresAt: FREE_SUBSCRIPTION_EXPIRES_AT,
                renewalDate: FREE_SUBSCRIPTION_EXPIRES_AT,
            },
        });

        await tx.profile.create({
            data: {
                userId: user.id,
                language: 'PT',
                timezone: 'UTC',
                theme: 'SYSTEM',
                aiName: 'Velunix AI',
            },
        });

        await tx.userSettings.create({
            data: {
                userId: user.id,
                language: 'PT',
                timezone: 'UTC',
                theme: 'SYSTEM',
                notifications: true,
                aiMode: 'GENERATIVE',
            },
        });

        return user;
    });
}

export async function getUserByEmailRepository(userEmail: string) {
    const user = await prisma.user.findUnique({
        where: {
            email: userEmail,
        },
    });

    return user;
}

export async function getUserByIdRepository(userId: string) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    return user;
}

export async function saveRefreshToken(saveRefreshTokenParams: RefreshTokenType) {
    const tokenHash = crypto.createHash('sha256').update(saveRefreshTokenParams.token).digest('hex');

    return await prisma.refreshToken.upsert({
        where: { userId: saveRefreshTokenParams.userId },
        update: {
            tokenHash,
            expiresAt: saveRefreshTokenParams.expiresAt,
            revoked: false,
        },
        create: {
            tokenHash,
            userId: saveRefreshTokenParams.userId,
            expiresAt: saveRefreshTokenParams.expiresAt,
            revoked: false,
        },
    });
}

export async function revokeRefreshToken(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    return await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
    });
}

export async function revokeAllUserTokens(userId: string) {
    return await prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
    });
}

export async function isRefreshTokenValid(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await prisma.refreshToken.findMany({
        where: {
            tokenHash,
            revoked: false,
        },
    });

    return result[0] ?? null;
}

export async function savePasswordResetToken(savePasswordResetTokenParams: {
    userId: string;
    token: string;
    expiresAt: Date;
}) {
    const tokenHash = crypto.createHash('sha256').update(savePasswordResetTokenParams.token).digest('hex');

    return prisma.passwordResetToken.upsert({
        where: { userId: savePasswordResetTokenParams.userId },
        update: {
            tokenHash,
            expiresAt: savePasswordResetTokenParams.expiresAt,
            usedAt: null,
        },
        create: {
            userId: savePasswordResetTokenParams.userId,
            tokenHash,
            expiresAt: savePasswordResetTokenParams.expiresAt,
        },
    });
}

export async function getPasswordResetToken(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    return prisma.passwordResetToken.findFirst({
        where: {
            tokenHash,
            usedAt: null,
            expiresAt: {
                gt: new Date(),
            },
        },
        include: {
            user: true,
        },
    });
}

export async function usePasswordResetToken(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    return prisma.passwordResetToken.update({
        where: {
            tokenHash,
        },
        data: {
            usedAt: new Date(),
        },
    });
}

export async function updateUserPassword(userId: string, passwordHash: string) {
    return prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            passwordHash,
        },
    });
}

export async function deleteExpiredPasswordResetTokens() {
    return prisma.passwordResetToken.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
    });
}

export async function markUserAsVerified(userId: string) {
    return await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
    });
}

export async function updateUser(userId: string, updateUserParams: Partial<Prisma.UserUpdateInput>) {
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateUserParams,
        });

        return user;
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                throw new UserNotFoundError(userId);
            }
        }

        throw error;
    }
}

export async function updateUserProfilePhoto(userId: string, avatar: string) {
    const result = await prisma.user.update({
        where: { id: userId },
        data: { avatar },
    });

    return result ?? null;
}

export async function deleteUser(userId: string) {
    try {
        return await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                status: 'DELETED',
                deletedAt: new Date(),
            },
        });
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                throw new UserNotFoundError(userId);
            }
        }

        throw error;
    }
}

export async function hardDeleteUser(userId: string) {
    try {
        return await prisma.user.delete({
            where: {
                id: userId,
            },
        });
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            throw new UserNotFoundError(userId);
        }

        throw error;
    }
}
