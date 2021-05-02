/**
 * This file tests router implementation:
 * - query params validation
 * - lru cache
 *
 */

import { Request, Response } from 'express';
import { ExchangeRateOptions } from '../../dataLoaders/getExchangeRate';
import { round } from '../../helpers/helpers';
import { ErrorCodeEnum } from '../../types';
import { cache, quoteRoute } from '../quoteRoute';

let conversionRate: number | null;

jest.mock('../../config', () => ({
    validCurrencyList: ['ABC', 'DEF', 'GHJ'],
}));

jest.mock('../../dataLoaders/getExchangeRate.ts', () => ({
    getExchangeRate: jest.fn().mockImplementation(async (options: ExchangeRateOptions) => {
        return {
            success: true,
            result: {
                conversionRate,
            },
        };
    }),
}));

const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const getErrorPayload = ({ errorCode }: { errorCode: ErrorCodeEnum }) =>
    expect.objectContaining({
        success: false,
        error: expect.objectContaining({
            errorCode,
        }),
    });

let req = {} as Request;
let res = {} as Response;

beforeEach(() => {
    req.query = {
        base_currency: 'ABC',
        quote_currency: 'DEF',
        base_amount: '100', // all query params are strings
    };
    res = mockResponse();
    conversionRate = 1.5;
    cache.flush();
});

describe('quoteRoute', () => {
    describe('should return error', () => {
        describe('InvalidBaseCurrencyCode', () => {
            it('for base_currency=XYZ', async () => {
                req.query.base_currency = 'XYZ';
                const expected = getErrorPayload({
                    errorCode: ErrorCodeEnum.InvalidBaseCurrencyCode,
                });
                await quoteRoute(req, res);
                expect(res.status).toBeCalledWith(422);
                expect(res.json).toBeCalledWith(expected);
            });
        });

        describe('InvalidTargetCurrencyCode', () => {
            it('for quote_currency=XYZ', async () => {
                req.query.quote_currency = 'XYZ';
                const expected = getErrorPayload({
                    errorCode: ErrorCodeEnum.InvalidTargetCurrencyCode,
                });
                await quoteRoute(req, res);
                expect(res.status).toBeCalledWith(422);
                expect(res.json).toBeCalledWith(expected);
            });
        });

        describe('InvalidCurrencyCodePair', () => {
            it('for base_currency === quote_currency', async () => {
                req.query.base_currency = 'ABC';
                req.query.quote_currency = 'ABC';
                const expected = getErrorPayload({
                    errorCode: ErrorCodeEnum.InvalidCurrencyCodePair,
                });
                await quoteRoute(req, res);
                expect(res.status).toBeCalledWith(422);
                expect(res.json).toBeCalledWith(expected);
            });
        });

        describe('InvalidAmount', () => {
            it('for base_amount=invalid-amount', async () => {
                req.query.base_amount = 'invalid-amount';
                const expected = getErrorPayload({ errorCode: ErrorCodeEnum.InvalidAmount });
                await quoteRoute(req, res);
                expect(res.status).toBeCalledWith(422);
                expect(res.json).toBeCalledWith(expected);
            });

            it('for negative base_amount', async () => {
                req.query.base_amount = '-100';
                const expected = getErrorPayload({ errorCode: ErrorCodeEnum.InvalidAmount });
                await quoteRoute(req, res);
                expect(res.status).toBeCalledWith(422);
                expect(res.json).toBeCalledWith(expected);
            });

            it('for float base_amount', async () => {
                req.query.base_amount = '123.45';
                const expected = getErrorPayload({ errorCode: ErrorCodeEnum.InvalidAmount });
                await quoteRoute(req, res);
                expect(res.status).toBeCalledWith(422);
                expect(res.json).toBeCalledWith(expected);
            });
        });

        describe('UnknownError', () => {
            it('for invalid conversionRate in response', async () => {
                conversionRate = null;
                const expected = getErrorPayload({ errorCode: ErrorCodeEnum.UnknownError });
                await quoteRoute(req, res);
                expect(res.status).toBeCalledWith(500);
                expect(res.json).toBeCalledWith(expected);
            });
        });
    });

    describe('when all params are valid', () => {
        it('should return valid result', async () => {
            await quoteRoute(req, res);
            expect(res.json).toBeCalledWith({
                exchange_rate: expect.any(Number),
                quote_amount: expect.any(Number),
            });
        });
    });

    describe('with passed query params', () => {
        const rateList = [0.123, 1.123];
        const baseAmountList = [50, 100, 250];

        rateList.forEach(rate => {
            baseAmountList.forEach(amount => {
                it(`should return quote_amount(${
                    amount * rate
                }) = baseAmount(${amount}) * conversionRate(${rate})`, async () => {
                    req.query.base_amount = `${amount}`; // string
                    conversionRate = rate;
                    await quoteRoute(req, res);
                    expect(res.json).toBeCalledWith({
                        exchange_rate: rate,
                        quote_amount: round(amount * rate),
                    });
                });
            });
        });
    });

    describe('exchangeRate', () => {
        const baseAmount = 100;
        const rateList = [0.8765, 0.999, 1.2344, 1.2345, 1.9999];
        const rateListRounded = [0.877, 0.999, 1.234, 1.235, 2];
        const quoteAmountList = [88, 100, 123, 123, 200];

        rateList.forEach((rate, index) => {
            const rateRounded = rateListRounded[index];
            it(`should be rounded to precission of 3 (${rate} -> ${rateRounded})`, async () => {
                req.query.base_amount = `${baseAmount}`;
                conversionRate = rate;
                await quoteRoute(req, res);
                expect(res.json).toBeCalledWith({
                    exchange_rate: rateRounded,
                    quote_amount: quoteAmountList[index],
                });
            });
        });
    });

    describe('lruCache', () => {
        it('should return cached value on second call', async () => {
            await quoteRoute(req, res);
            expect(res.set).toBeCalledWith(expect.objectContaining({ 'X-cache': 'MISS' }));
            await quoteRoute(req, res);
            expect(res.set).toBeCalledWith(expect.objectContaining({ 'X-cache': 'HIT' }));
        });
    });
});
