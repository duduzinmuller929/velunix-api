import type { FastifyInstance } from 'fastify';
import z from 'zod';

import {
    createCouponController,
    deleteCouponController,
    getCouponByCodeController,
    updateCouponController,
} from './coupon.controller';
import { createCouponSchema, updateCouponSchema } from './coupon.schemas';

export async function couponRoutes(app: FastifyInstance) {
    app.post(
        '/coupons/create',
        {
            schema: {
                summary: 'Criar um novo cupom',
                tags: ['Coupons'],
                body: createCouponSchema,
                response: {
                    201: z.object({
                        message: z.string(),
                        coupon: z.object({
                            id: z.string(),
                            code: z.string(),
                            type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
                            value: z.number(),
                            maxUses: z.number(),
                            status: z.enum(['ACTIVE', 'EXPIRED', 'DISABLED']),
                            planId: z.string().nullable(),
                            expiresAt: z.date().nullable(),
                            isActive: z.boolean(),
                            minimumAmount: z.number().nullable(),
                            maximumDiscount: z.number().nullable(),
                            firstPurchaseOnly: z.boolean(),
                            perUserLimit: z.number().nullable(),
                            description: z.string().nullable(),
                            startsAt: z.date().nullable(),
                            createdAt: z.date(),
                        }),
                    }),
                },
            },
        },
        createCouponController,
    );
    app.get(
        '/coupons/:code',
        {
            schema: {
                summary: 'Obter cupom pelo codigo',
                tags: ['Coupons'],
            },
        },
        getCouponByCodeController,
    );
    app.put(
        '/coupons/:code',
        {
            schema: {
                summary: 'Atualizar cupom',
                tags: ['Coupons'],
                body: updateCouponSchema,
            },
        },
        updateCouponController,
    );
    app.delete(
        '/coupons/:code',
        {
            schema: {
                summary: 'Deletar Cupom',
                tags: ['Coupons'],
            },
        },
        deleteCouponController,
    );
}
