import z from 'zod';

export const couponSchema = z.object({
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
        .max(100000),

    maxUses: z
        .number({
            message: 'A quantidade máxima de usos é obrigatória.',
        })
        .int()
        .min(1)
        .max(1000000),

    status: z.enum(['ACTIVE', 'EXPIRED', 'DISABLED']).default('ACTIVE'),

    planId: z.string().uuid('Plano inválido.').optional(),

    expiresAt: z
        .union([z.string().datetime(), z.date()])
        .optional()
        .transform((val) => (val ? (val instanceof Date ? val : new Date(val)) : undefined)),

    isActive: z.boolean().default(true),

    minimumAmount: z.number().min(0).optional(),

    maximumDiscount: z.number().min(0).optional(),

    firstPurchaseOnly: z.boolean().default(false),

    perUserLimit: z.number().int().min(1).optional(),

    description: z.string().trim().max(255).optional(),

    startsAt: z
        .union([z.string().datetime(), z.date()])
        .optional()
        .transform((val) => (val ? (val instanceof Date ? val : new Date(val)) : undefined)),
});

export const createCouponSchema = couponSchema.superRefine((data, ctx) => {
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
});

export const updateCouponSchema = couponSchema.partial();
