import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

import type { Prisma } from '../../../prisma/generated/client';
import { prisma } from '../../plugins/prisma';
import { sendPasswordResetEmail, sendVerificationEmail } from '../../utils/email';
import { generateEmailVerificationToken } from '../../utils/email-verification';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { generatePasswordResetToken } from '../../utils/password-reset';
import { getSignedFileUrl, uploadFile } from '../../utils/s3';
import {
    EmailAlreadyInUseError,
    FreePlanAssignmentError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    UserNotCreatedError,
    UserNotFoundError,
    UserNotFoundLogin,
    UserNotUpdatedError,
    UserProfilePhotoError,
} from './user.errors';
import {
    createUserAuthProvider,
    createUserRepository,
    deleteExpiredPasswordResetTokens as deleteExpiredPasswordResetTokensRepository,
    deleteUser,
    getPasswordResetToken,
    getUserByEmailRepository,
    getUserByIdRepository,
    isRefreshTokenValid,
    markUserAsVerified,
    revokeAllUserTokens,
    revokeRefreshToken,
    savePasswordResetToken,
    saveRefreshToken,
    updateUser,
    updateUserPassword,
    updateUserProfilePhoto,
    usePasswordResetToken,
} from './user.repository';
import type { CreateUserData, UpdateUserData } from './user.types';

export async function registerUserService(createUserParams: CreateUserData) {
    const existingUser = await getUserByEmailRepository(createUserParams.email);

    if (existingUser) {
        throw new EmailAlreadyInUseError(createUserParams.email);
    }

    const passwordHash = await argon2.hash(createUserParams.passwordHash);

    const freePlan = await prisma.plan.findFirst({
        where: { name: 'FREE' },
        select: { id: true },
    });

    if (!freePlan) {
        throw new FreePlanAssignmentError();
    }

    const userDb = await createUserRepository(
        {
            ...createUserParams,
            passwordHash,
        },
        freePlan.id,
    );

    if (!userDb) {
        throw new UserNotCreatedError();
    }

    const user: CreateUserData = {
        id: userDb.id,
        username: userDb.username,
        name: userDb.name,
        provider: userDb.provider,
        email: userDb.email,
        passwordHash: userDb.passwordHash,
        emailVerified: !!userDb.emailVerified,
    };

    try {
        await sendVerificationEmail(user.email, generateEmailVerificationToken(user.id));
    } catch (error) {
        console.error(error);
    }

    return user;
}

export async function verifyUserEmail(userId: string) {
    await markUserAsVerified(userId);
}

export async function loginUser(email: string, password: string) {
    const user = await getUserByEmailRepository(email);
    if (!user) throw new UserNotFoundLogin();

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw new InvalidCredentialsError();

    if (!user.avatar) {
        const defaultImageUrl = 'https://imgur.com/5Q9j39l';
        await updateUserProfilePhoto(user.id, defaultImageUrl);
        user.avatar = defaultImageUrl;
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await saveRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { user, accessToken, refreshToken };
}

export async function logoutUser(userId: string, refreshToken?: string) {
    if (refreshToken) {
        await revokeRefreshToken(refreshToken);
    }
}

export async function refreshAccessToken(oldRefreshToken: string) {
    try {
        const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET!) as {
            id: string;
        };
        const userId = decoded.id;

        const validToken = await isRefreshTokenValid(oldRefreshToken);
        if (!validToken) throw new InvalidRefreshTokenError();

        await revokeRefreshToken(oldRefreshToken);

        const newAccessToken = generateAccessToken(userId);
        const newRefreshToken = generateRefreshToken(userId);

        await saveRefreshToken({
            userId: userId,
            token: newRefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch {
        throw new InvalidRefreshTokenError();
    }
}

export async function getUserProfile(userId: string) {
    const user = await getUserByIdRepository(userId);
    if (!user) throw new UserNotFoundError(userId);

    return {
        id: user.id,
        username: user.username,
        name: user.name,
        provider: user.provider,
        email: user.email,
        passwordHash: user.passwordHash,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
    } as CreateUserData;
}

export async function updateUserService(data: UpdateUserData) {
    const user = await getUserByIdRepository(data.id);
    if (!user) throw new UserNotFoundError(data.id);

    const updatedUser = await updateUser(user.id, data as Partial<Prisma.UserUpdateInput>);
    if (!updatedUser) throw new UserNotUpdatedError(user.id);

    return updatedUser;
}

export async function deleteUserService(targetUserId: string, refreshToken?: string) {
    const targetUser = await getUserByIdRepository(targetUserId);
    if (!targetUser) throw new UserNotFoundError(targetUserId);

    await revokeAllUserTokens(targetUserId);

    await deleteUser(targetUserId);

    if (refreshToken) {
        await revokeRefreshToken(refreshToken);
    }
}

export async function uploadProfilePhoto(userId: string, fileBuffer: Buffer, fileName: string) {
    const user = await getUserByIdRepository(userId);
    if (!user) throw new UserNotFoundError(userId);

    const fileExtension = fileName.split('.').pop() || 'jpg';
    const fileKey = `profile-photos/${userId}/${Date.now()}.${fileExtension}`;

    await uploadFile({
        bucket: process.env.MINIO_BUCKET_NAME!,
        key: fileKey,
        body: fileBuffer,
    });

    const profilePhotoUrl = await getSignedFileUrl(process.env.MINIO_BUCKET_NAME!, fileKey, 24 * 60 * 60);

    const updatedUser = await updateUserProfilePhoto(userId, profilePhotoUrl);
    if (!updatedUser) throw new UserProfilePhotoError();

    return {
        profile_photo_url: profilePhotoUrl,
        file_key: fileKey,
    };
}

export async function resetPassword(email: string, newPassword: string) {
    const user = await getUserByEmailRepository(email);
    if (!user) throw new UserNotFoundError(email);

    const passwordHash = await argon2.hash(newPassword);
    await updateUserPassword(user.id, passwordHash);

    return { success: true };
}

export async function forgotPassword(email: string) {
    const user = await getUserByEmailRepository(email);
    if (!user) throw new UserNotFoundError(email);

    const passwordResetToken = generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

    await savePasswordResetToken({
        userId: user.id,
        token: passwordResetToken,
        expiresAt,
    });

    try {
        await sendPasswordResetEmail(user.email, passwordResetToken);
    } catch (error) {
        console.error(error);
    }

    return { success: true };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
    const passwordResetToken = await getPasswordResetToken(token);
    if (!passwordResetToken) throw new InvalidRefreshTokenError();

    await usePasswordResetToken(token);

    const passwordHash = await argon2.hash(newPassword);
    await updateUserPassword(passwordResetToken.userId, passwordHash);

    return { success: true };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await getUserByIdRepository(userId);
    if (!user) throw new UserNotFoundError(userId);

    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) throw new InvalidCredentialsError();

    const passwordHash = await argon2.hash(newPassword);
    await updateUserPassword(userId, passwordHash);

    return { success: true };
}

export async function deleteExpiredPasswordResetTokens() {
    await deleteExpiredPasswordResetTokensRepository();

    return { success: true };
}

export async function registerOrLoginOAuthUser(createUserParams: CreateUserData, data: Omit<UpdateUserData, 'id'>) {
    const user = await getUserByEmailRepository(createUserParams.email);

    if (!user) {
        const freePlan = await prisma.plan.findFirst({
            where: { name: 'FREE' },
            select: { id: true },
        });

        if (!freePlan) {
            throw new FreePlanAssignmentError();
        }
        const userDb = await createUserAuthProvider(createUserParams, freePlan.id);
        if (!userDb) throw new UserNotCreatedError();

        const updatedUser = await updateUser(userDb.id, data as Partial<Prisma.UserUpdateInput>);
        if (!updatedUser) throw new FreePlanAssignmentError();
    } else {
        if (!user.emailVerified) {
            await markUserAsVerified(user.id);
            user.emailVerified = true;
        }
        if (createUserParams.avatar && user.avatar) {
            const avatar = createUserParams.avatar;
            await updateUserProfilePhoto(user.id, avatar);
            user.avatar = avatar;
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        await saveRefreshToken({
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        return {
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                provider: user.provider,
                email: user.email,
                passwordHash: user.passwordHash,
                emailVerified: user.emailVerified,
                avatar: user.avatar,
                createdAt: user.createdAt,
            },
            accessToken,
            refreshToken,
        };
    }
}
