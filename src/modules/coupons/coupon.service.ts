import {
    CouponAlreadyInUseError,
    CouponNotCreatedError,
    CouponNotFoundError,
    CouponNotUpdatedError,
} from './coupon.errors';
import { createCoupon, deleteCoupon, getCouponByCode, getCouponById, updateCoupon } from './coupon.repository';
import type { CreateCouponParams, UpdateCouponParams } from './coupon.types';

export async function createCouponService(createCouponParams: CreateCouponParams) {
    const existingCoupon = await getCouponByCode(createCouponParams.code);

    if (existingCoupon) {
        throw new CouponAlreadyInUseError(createCouponParams.code);
    }

    const coupon = await createCoupon(createCouponParams);

    if (!coupon) {
        throw new CouponNotCreatedError();
    }

    return coupon;
}

export async function getCouponByCodeService(code: string) {
    const coupon = await getCouponByCode(code);

    if (!coupon) {
        throw new CouponNotFoundError(code);
    }

    return coupon;
}

export async function getCouponByIdService(id: string) {
    const coupon = await getCouponById(id);

    if (!coupon) {
        throw new CouponNotFoundError(id);
    }

    return coupon;
}

export async function updateCouponService(code: string, updateCouponParams: UpdateCouponParams) {
    const coupon = await updateCoupon(code, updateCouponParams);

    if (!coupon) {
        throw new CouponNotUpdatedError(code);
    }

    return coupon;
}

export async function deleteCouponService(code: string) {
    const coupon = await deleteCoupon(code);

    if (!coupon) {
        throw new CouponNotFoundError(code);
    }

    return coupon;
}
