import { Request, Response } from 'express';
import { ExchangeRateResult, getExchangeRate } from '../dataLoaders/getExchangeRate';
import { createErrorResponse } from '../helpers/errorResponse';
import { isValidAmount, isValidCurrency, parseInteger, round } from '../helpers/helpers';
import logger from '../helpers/logger';
import LruCache from '../LruCache/LruCache';
import { Currency, ErrorCodeEnum, ErrorType } from '../types';

const DEFAULT_PRECISION = 3;
const DEFAULT_CACHE_SIZE = 2;
const DEFAULT_CACHE_TTL = 1000 * 10; // ms

const precision: number = process.env.ROUND_PRECISION
    ? parseInt(process.env.ROUND_PRECISION)
    : DEFAULT_PRECISION;
const cacheSize = process.env.CACHE_SIZE ? parseInt(process.env.CACHE_SIZE) : DEFAULT_CACHE_SIZE;
const cacheTTL = process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : DEFAULT_CACHE_TTL;

export const cache = new LruCache({
    size: cacheSize,
    ttl: cacheTTL,
});

const validateParams = ({
    baseCurrency,
    targetCurrency,
    baseAmount,
}: {
    baseCurrency: Currency;
    targetCurrency: Currency;
    baseAmount: number;
}) => {
    let errorCode: ErrorCodeEnum | null = null;

    if (!isValidCurrency(baseCurrency)) {
        errorCode = ErrorCodeEnum.InvalidBaseCurrencyCode;
    } else if (!isValidCurrency(targetCurrency)) {
        errorCode = ErrorCodeEnum.InvalidTargetCurrencyCode;
    } else if (baseCurrency === targetCurrency) {
        errorCode = ErrorCodeEnum.InvalidCurrencyCodePair;
    } else if (!isValidAmount(baseAmount)) {
        errorCode = ErrorCodeEnum.InvalidAmount;
    }

    return errorCode;
};

export const quoteRoute = async (req: Request, res: Response) => {
    const { base_currency, quote_currency, base_amount } = req.query;
    const baseCurrency = base_currency?.toString().toUpperCase() as Currency;
    const targetCurrency = quote_currency?.toString().toUpperCase() as Currency;
    const baseAmount = parseInteger(base_amount?.toString()) || 0;

    const errorCode = validateParams({
        baseCurrency,
        targetCurrency,
        baseAmount,
    });

    if (errorCode !== null) {
        return res.status(422).json(createErrorResponse({ errorCode }));
    }

    let success: boolean;
    let error: ErrorType | undefined | null;
    let result: ExchangeRateResult | undefined;

    const cacheKey = `${baseCurrency}-${targetCurrency}`;
    const cacheResult = cache.get(cacheKey);
    let cacheHit = false;

    if (cacheResult !== null) {
        // key was found in cache
        logger.debug('Key %s was found in cache', cacheKey);
        success = true;
        cacheHit = true;
        error = null;
        result = cacheResult.value;
    } else {
        // key was NOT found in cache or cache was expired
        logger.debug('Key %s was NOT found in cache. Making request to service...', cacheKey);
        ({ success, error, result } = await getExchangeRate({
            baseCurrency,
            targetCurrency,
            baseAmount,
        }));

        // if API responses was successful, put result to cache
        /* istanbul ignore else as error handling is covered getExchangeRate.test.ts */
        if (success && result) {
            cache.put(cacheKey, result);
        }
    }

    if (!success || !result?.conversionRate) {
        logger.error('Failed to fetch conversion rate', error);
        return res.status(error?.statusCode || 500).json(
            createErrorResponse({
                errorCode: error?.errorCode,
            })
        );
    }

    const exchangeRate = round(result.conversionRate, precision);
    const quoteAmount = round(baseAmount * result.conversionRate, 0); // integer

    const cacheRemainingTime = cacheResult?.timestamp
        ? cacheTTL - (Date.now() - cacheResult?.timestamp)
        : null;

    const maxAgeMs = cacheRemainingTime ? cacheRemainingTime : cacheTTL;
    const maxAge = Math.floor(maxAgeMs / 1000);

    // X-cache header is usefull to check if response was cached
    const headers: Record<string, string | number> = {
        'X-cache': cacheHit ? 'HIT' : 'MISS',
    };

    // max-age header is set to match LRU cache TTL
    /* istanbul ignore else */
    if (maxAge) {
        headers['cache-control'] = `max-age=${maxAge}`;
    }

    res.set(headers).json({
        exchange_rate: exchangeRate, // Decimal, the offered exchange rate. Up to 3 decimal digits.
        quote_amount: quoteAmount, // Integer, the expected amount in cents. You can choose the rounding policy.

        /**
         * Additional return properties are commented out to match tasks requirements
         * If uncommented, they can be used to validate task implementation
         */
        // baseCurrency,
        // targetCurrency,
        // baseAmount,
        // roundPrecision: precision,
    });
};
