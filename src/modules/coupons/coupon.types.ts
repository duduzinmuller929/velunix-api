import type { CouponStatus, CouponType } from '../../../prisma/generated/enums';

export interface CreateCouponParams {
    id: string;
    code: string;
    type: CouponType;
    value: number;
    maxUses: number;
    status: CouponStatus;
    expiresAt: Date;
    isActive: boolean;
    planId: string;
    minimumAmount?: number | null;
    maximumDiscount?: number | null;
    firstPurchaseOnly?: boolean | null;
    perUserLimit?: number | null;
    description?: string | null;
    startsAt?: Date | null;
}

export interface UpdateCouponParams {
    id: string;
    code?: string;
    type?: CouponType;
    value?: number;
    maxUses?: number;
    status?: CouponStatus;
    expiresAt?: Date;
    isActive?: boolean;
    planId?: string;
    minimumAmount?: number;
    maximumDiscount?: number;
    firstPurchaseOnly?: boolean;
    perUserLimit?: number;
    description?: string;
    startsAt?: Date;
}
