import { randomUUID } from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { badRequest, created, internalServerError, notFound, ok } from '../../utils/http';
import {
    CouponAlreadyInUseError,
    CouponNotCreatedError,
    CouponNotFoundError,
    CouponNotUpdatedError,
} from './coupon.errors';
import { createCouponSchema, updateCouponSchema } from './coupon.schemas';
import {
    createCouponService,
    deleteCouponService,
    getCouponByCodeService,
    getCouponByIdService,
    updateCouponService,
} from './coupon.service';
import type { UpdateCouponParams } from './coupon.types';

export async function createCouponController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const params = createCouponSchema.parse(req.body);
        const couponParams = {
            id: randomUUID(),
            ...params,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            minimumAmount: params.minimumAmount ?? null,
            maximumDiscount: params.maximumDiscount ?? null,
            firstPurchaseOnly: params.firstPurchaseOnly ?? false,
            perUserLimit: params.perUserLimit ?? null,
            description: params.description ?? null,
            startsAt: params.startsAt ?? null,
        };

        const coupon = await createCouponService(couponParams);

        return created(reply, { message: 'Cupom criado com sucesso', coupon });
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            const message = error.issues[0]?.message ?? 'Dados inválidos fornecidos';
            return badRequest(reply, { message });
        }

        if (error instanceof CouponAlreadyInUseError) {
            return badRequest(reply, error.message);
        }
        if (error instanceof CouponNotCreatedError) {
            return badRequest(reply, error.message);
        }
        return internalServerError(reply);
    }
}

export async function getCouponByCodeController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { code } = req.params as { code: string };

        const coupon = await getCouponByCodeService(code);

        return ok(reply, { coupon });
    } catch (error) {
        console.error(error);
        if (error instanceof CouponNotFoundError) {
            return notFound(reply, error.message);
        }
        return internalServerError(reply);
    }
}

export async function getCouponByIdController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = req.params as { id: string };

        const coupon = await getCouponByIdService(id);

        return ok(reply, { coupon });
    } catch (error) {
        console.error(error);
        if (error instanceof CouponNotFoundError) {
            return notFound(reply, error.message);
        }
        return internalServerError(reply);
    }
}

export async function updateCouponController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { code } = req.params as { code: string };
        const params = updateCouponSchema.parse(req.body);

        const updateData: UpdateCouponParams = {
            id: '',
        };

        const existingCoupon = await getCouponByCodeService(code);
        updateData.id = existingCoupon.id;

        if (params.code !== undefined) {
            updateData.code = params.code;
        }
        if (params.type !== undefined) {
            updateData.type = params.type;
        }
        if (params.value !== undefined) {
            updateData.value = params.value;
        }
        if (params.maxUses !== undefined) {
            updateData.maxUses = params.maxUses;
        }
        if (params.status !== undefined) {
            updateData.status = params.status;
        }
        if (params.expiresAt !== undefined) {
            updateData.expiresAt = params.expiresAt;
        }
        if (params.isActive !== undefined) {
            updateData.isActive = params.isActive;
        }
        if (params.planId !== undefined) {
            updateData.planId = params.planId;
        }
        if (params.minimumAmount !== undefined) {
            updateData.minimumAmount = params.minimumAmount;
        }
        if (params.maximumDiscount !== undefined) {
            updateData.maximumDiscount = params.maximumDiscount;
        }
        if (params.firstPurchaseOnly !== undefined) {
            updateData.firstPurchaseOnly = params.firstPurchaseOnly;
        }
        if (params.perUserLimit !== undefined) {
            updateData.perUserLimit = params.perUserLimit;
        }
        if (params.description !== undefined) {
            updateData.description = params.description;
        }
        if (params.startsAt !== undefined) {
            updateData.startsAt = params.startsAt;
        }

        const coupon = await updateCouponService(code, updateData);

        return ok(reply, { coupon });
    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            return badRequest(reply, { message: error.issues[0]?.message ?? 'Dados inválidos fornecidos' });
        }
        if (error instanceof CouponNotUpdatedError) {
            return badRequest(reply, error.message);
        }
        return internalServerError(reply);
    }
}

export async function deleteCouponController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { code } = req.params as { code: string };

        const coupon = await deleteCouponService(code);

        return ok(reply, { coupon });
    } catch (error) {
        console.error(error);
        if (error instanceof CouponNotFoundError) {
            return notFound(reply, error.message);
        }
        return internalServerError(reply);
    }
}
