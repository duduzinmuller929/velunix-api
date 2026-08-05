import { prisma } from '../../plugins/prisma';
import type { CreateCouponParams, UpdateCouponParams } from './coupon.types';

export async function createCoupon(createCouponParams: CreateCouponParams) {
    const coupon = await prisma.coupon.create({
        data: {
            id: createCouponParams.id,
            code: createCouponParams.code,
            type: createCouponParams.type,
            value: createCouponParams.value,
            maxUses: createCouponParams.maxUses,
            status: createCouponParams.status,
            expiresAt: createCouponParams.expiresAt,
            isActive: createCouponParams.isActive,
            planId: createCouponParams.planId,
            minimumAmount: createCouponParams.minimumAmount ?? null,
            maximumDiscount: createCouponParams.maximumDiscount ?? null,
            firstPurchaseOnly: createCouponParams.firstPurchaseOnly ?? false,
            perUserLimit: createCouponParams.perUserLimit ?? null,
            description: createCouponParams.description ?? null,
            startsAt: createCouponParams.startsAt ?? null,
        },
    });

    return coupon;
}

export async function getCouponByCode(code: string) {
    const coupon = await prisma.coupon.findUnique({
        where: {
            code,
        },
    });

    return coupon;
}

export async function getCouponById(id: string) {
    const coupon = await prisma.coupon.findUnique({
        where: {
            id,
        },
    });

    return coupon;
}

export async function updateCoupon(code: string, updateCouponParams: UpdateCouponParams) {
    const coupon = await prisma.coupon.update({
        where: {
            code,
        },
        data: updateCouponParams,
    });

    return coupon;
}

export async function deleteCoupon(code: string) {
    const coupon = await prisma.coupon.delete({
        where: {
            code,
        },
    });

    return coupon;
}
