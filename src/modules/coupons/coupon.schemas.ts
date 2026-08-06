import { z } from 'zod';

export const createCouponSchema = z
    .object({
        code: z
            .string({
                message: 'O código do cupom é obrigatório.',
            })
            .trim()
            .toUpperCase()
            .min(3, 'O código deve possuir pelo menos 3 caracteres.')
            .max(50, 'O código deve possuir no máximo 50 caracteres.')
            .regex(/^[A-Z0-9_-]+$/, 'O código pode conter apenas letras, números, underline e hífen.'),

        type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT'], {
            message: 'O tipo do cupom é obrigatório.',
        }),

        value: z
            .number({
                message: 'O valor do cupom é obrigatório.',
            })
            .positive('O valor deve ser maior que zero.')
            .max(100000, 'O valor máximo permitido é 100000.'),

        maxUses: z
            .number({
                message: 'A quantidade máxima de usos é obrigatória.',
            })
            .int('A quantidade de usos deve ser um número inteiro.')
            .min(1, 'O cupom deve possuir pelo menos 1 uso.')
            .max(1000000, 'O limite máximo de usos é 1 milhão.'),

        status: z
            .enum(['ACTIVE', 'EXPIRED', 'DISABLED'], {
                message: 'O status do cupom é obrigatório.',
            })
            .default('ACTIVE'),

        planId: z.string().uuid('Plano inválido.').optional(),

        expiresAt: z
            .date({
                message: 'A data de expiração é obrigatória.',
            })
            .optional(),

        isActive: z.boolean().default(true),

        minimumAmount: z.number().min(0, 'O valor mínimo não pode ser negativo.').optional(),

        maximumDiscount: z.number().min(0, 'O desconto máximo não pode ser negativo.').optional(),

        firstPurchaseOnly: z.boolean().default(false),

        perUserLimit: z
            .number()
            .int('O limite por usuário deve ser inteiro.')
            .min(1, 'O limite por usuário deve ser pelo menos 1.')
            .optional(),

        description: z.string().trim().max(255, 'A descrição deve possuir no máximo 255 caracteres.').optional(),

        startsAt: z.date().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.type === 'PERCENTAGE' && data.value > 100) {
            ctx.addIssue({
                code: 'custom',
                path: ['value'],
                message: 'Um cupom percentual não pode possuir valor maior que 100%.',
            });
        }

        if (data.expiresAt && data.expiresAt <= new Date()) {
            ctx.addIssue({
                code: 'custom',
                path: ['expiresAt'],
                message: 'A data de expiração deve ser uma data futura.',
            });
        }

        if (data.startsAt && data.expiresAt && data.startsAt >= data.expiresAt) {
            ctx.addIssue({
                code: 'custom',
                path: ['startsAt'],
                message: 'A data de início deve ser anterior à data de expiração.',
            });
        }

        if (data.maximumDiscount && data.type !== 'PERCENTAGE') {
            ctx.addIssue({
                code: 'custom',
                path: ['maximumDiscount'],
                message: 'O desconto máximo só pode ser utilizado em cupons percentuais.',
            });
        }

        if (data.minimumAmount && data.minimumAmount < 0) {
            ctx.addIssue({
                code: 'custom',
                path: ['minimumAmount'],
                message: 'O valor mínimo não pode ser negativo.',
            });
        }
    });

export const updateCouponSchema = createCouponSchema.partial();
