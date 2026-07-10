import { prisma } from '../../plugins/prisma';
import type { UserType } from './users.types';

export async function createUser(createUserParams: UserType) {
    return prisma.user.create({
        data: {
            id: createUserParams.id,
            name: createUserParams.name,
            username: createUserParams.username,
            email: createUserParams.email,
            passwordHash: createUserParams.passwordHash,
            phone: createUserParams.phone ?? null,
            cpfCnpj: createUserParams.cpfCnpj ?? null,
            avatar: createUserParams.avatar ?? null,
            roleId: createUserParams.roleId,
            emailVerified: createUserParams.emailVerified,
            twoFactorEnabled: createUserParams.twoFactorEnabled,
            status: createUserParams.status,
            createdAt: createUserParams.createdAt,
            updatedAt: createUserParams.updatedAt,
        },
    });
}
