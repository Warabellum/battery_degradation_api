import rateLimit from 'express-rate-limit';

export const createRateLimit = (requests, windowMs) => {
    return rateLimit({
        windowMs,
        max: requests,
        message: {
            success: false,
            error: 'Rate limit exceeded',
            message: `Too many requests. Limit: ${requests} per ${windowMs / 1000}s`
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Different limits for different plans
export const freeTierLimit = createRateLimit(100, 24 * 60 * 60 * 1000); // 100/day
export const basicTierLimit = createRateLimit(1000, 24 * 60 * 60 * 1000); // 1000/day
export const proTierLimit = createRateLimit(10000, 24 * 60 * 60 * 1000); // 10000/day