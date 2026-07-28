import { z } from 'zod/v4';

export const registerSchema = z.object(
    {
        name: z
            .string()
            .trim()
            .min(3, { message: 'O nome deve possuir pelo menos 3 caracteres.' })
            .max(100, { message: 'O nome deve possuir no máximo 100 caracteres.' }),

        username: z
            .string()
            .trim()
            .toLowerCase()
            .min(3, { message: 'O usuário deve possuir pelo menos 3 caracteres.' })
            .max(30, { message: 'O usuário deve possuir no máximo 30 caracteres.' })
            .regex(/^[a-z0-9._]+$/, {
                message: 'O usuário pode conter apenas letras minúsculas, números, ponto e underline.',
            }),

        email: z.string().trim().email({ message: 'E-mail inválido.' }).max(255),

        passwordHash: z
            .string()
            .min(8, { message: 'A senha deve possuir no mínimo 8 caracteres.' })
            .max(100)
            .regex(/[A-Z]/, { message: 'A senha deve conter uma letra maiúscula.' })
            .regex(/[a-z]/, { message: 'A senha deve conter uma letra minúscula.' })
            .regex(/[0-9]/, { message: 'A senha deve conter um número.' })
            .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, { message: 'A senha deve conter um caractere especial.' }),

        phone: z.string().trim().optional(),

        avatar: z.string().url().optional(),
    },
    {
        error: (issue) => {
            if (issue.code === 'invalid_type' && issue.input === null) {
                return 'O corpo da requisição é obrigatório.';
            }
        },
    },
);

export const loginSchema = z.object({
    email: z.string().trim().email({ message: 'E-mail inválido.' }),

    password: z.string().min(8, { message: 'Senha inválida.' }),
});

export const updateUserSchema = registerSchema.partial();

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(8),

        newPassword: z
            .string()
            .min(8)
            .max(100)
            .regex(/[A-Z]/)
            .regex(/[a-z]/)
            .regex(/[0-9]/)
            .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/),

        confirmPassword: z.string().min(8),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'As senhas não coincidem.',
        path: ['confirmPassword'],
    });

export const forgotPasswordSchema = z.object({
    email: z.string().trim().email('E-mail inválido.'),
});

export const resetPasswordSchema = z
    .object({
        token: z.string().min(64),

        password: z
            .string()
            .min(8)
            .max(100)
            .regex(/[A-Z]/)
            .regex(/[a-z]/)
            .regex(/[0-9]/)
            .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/),

        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'As senhas não coincidem.',
        path: ['confirmPassword'],
    });

export const verifyEmailSchema = z.object({
    token: z.string().min(64),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(20),
});

export const userIdSchema = z.object({
    id: z.uuid(),
});
