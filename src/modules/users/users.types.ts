export interface UserType {
    id: string;
    name: string;
    username: string;
    email: string;
    passwordHash: string;
    phone?: string | null;
    cpfCnpj?: string | null;
    avatar?: string | null;
    roleId: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}
