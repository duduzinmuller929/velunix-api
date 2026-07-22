import type { Provider } from '../../../prisma/generated/enums';

export interface CreateUserData {
    id: string;
    name: string;
    username: string;
    email: string;
    passwordHash: string;
    avatar?: string | undefined;
    phone?: string | undefined;
    emailVerified?: boolean;
    provider: Provider;
    roleId?: string | undefined;
}

export interface RefreshTokenType {
    userId: string;
    token: string;
    revoked?: boolean;
    expiresAt: Date;
}

export type UpdateUserData = {
    id: string;
    name?: string | undefined;
    username?: string | undefined;
    email?: string | undefined;
    password?: string | undefined;
    avatarUrl?: string | null;
    verified?: boolean;
    cpfCnpj?: string | undefined;
    createdAt?: Date;
};
