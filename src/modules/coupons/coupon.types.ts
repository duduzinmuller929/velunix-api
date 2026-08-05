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
}
