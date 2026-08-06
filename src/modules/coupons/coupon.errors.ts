export class CouponNotFoundError extends Error {
    readonly code = 'COUPON_NOT_FOUND' as const;
    constructor(readonly couponId: string) {
        super(`Coupon not found: ${couponId}`);
        this.name = 'CouponNotFoundError';
    }
}

export class CouponAlreadyInUseError extends Error {
    constructor(readonly code: string) {
        super(`O cupom ${code} ja foi criado`);
        this.name = 'CouponAlreadyInUseError ';
    }
}

export class CouponNotCreatedError extends Error {
    readonly code = 'COUPON_NOT_CREATED' as const;
    constructor() {
        super(`Coupon not created`);
        this.name = 'CouponNotCreatedError';
    }
}

export class CouponNotUpdatedError extends Error {
    readonly code = 'COUPON_NOT_UPDATED' as const;
    constructor(readonly couponId: string) {
        super(`Coupon not updated: ${couponId}`);
        this.name = 'CouponNotUpdatedError';
    }
}
