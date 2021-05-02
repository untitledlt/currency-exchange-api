import { RequestInit } from 'node-fetch';
import { Currency } from '../../types';
import { getExchangeRate } from '../getExchangeRate';

const API_URL = 'http://fake-api-url/{{API_KEY}}/pair/{{FROM}}/{{TO}}';
const API_KEY = 'THIS_IS_API_KEY';
const ERROR_CODES = {
    serviceError: 'ServiceError',
};
let baseCurrency: Currency;
let targetCurrency: Currency;
let baseAmount: number;
let conversionRate: number;

jest.mock('../../helpers/fetch.ts', () => {
    return {
        fetchJson: jest.fn().mockImplementation(async (url: string, options?: RequestInit) => {
            const [from, to] = url.split('/').slice(-2);

            if (url === 'return-service-error') {
                return {
                    success: false,
                    error: {
                        errorCode: ERROR_CODES.serviceError,
                    },
                };
            } else if (url === 'return-invalid-response') {
                return {
                    success: true,
                    result: {
                        result: 'success',
                        conversion_rate: 'not-a-number',
                    },
                };
            } else {
                return {
                    success: true,
                    result: {
                        result: 'success',
                        documentation: 'https://www.exchangerate-api.com/docs',
                        terms_of_use: 'https://www.exchangerate-api.com/terms',
                        time_last_update_unix: Date.now() - 10000,
                        time_last_update_utc: 'Fri, 30 Apr 2021 00:00:01 +0000',
                        time_next_update_unix: Date.now() + 10000,
                        time_next_update_utc: 'Sat, 01 May 2021 00:00:01 +0000',
                        base_code: from,
                        target_code: to,
                        conversion_rate: conversionRate,
                    },
                };
            }
        }),
    };
});

import { fetchJson } from '../../helpers/fetch';

const expectedBaseResult = {
    success: true,
    result: {
        conversionRate: expect.any(Number),
    },
};

const getFormatedUrl = ({
    baseCurrency,
    targetCurrency,
}: {
    baseCurrency: Currency;
    targetCurrency: Currency;
}) => `http://fake-api-url/${API_KEY}/pair/${baseCurrency}/${targetCurrency}`;

beforeEach(() => {
    process.env.EXCHANGERATE_API_URL = API_URL;
    process.env.EXCHANGERATE_API_KEY = API_KEY;
    baseCurrency = 'EUR';
    targetCurrency = 'USD';
    baseAmount = 100;
    conversionRate = 1.5;
});

describe('getExchangeRate', () => {
    it('should return valid result', async () => {
        const result = await getExchangeRate({
            baseCurrency,
            targetCurrency,
            baseAmount,
        });
        const formatedUrl = getFormatedUrl({ baseCurrency, targetCurrency });

        expect(fetchJson).toHaveBeenCalledTimes(1);
        expect(fetchJson).toHaveBeenCalledWith(formatedUrl);
        expect(result).toMatchObject(expectedBaseResult);
    });

    it('should return service request error', async () => {
        process.env.EXCHANGERATE_API_URL = 'return-service-error';

        const result = await getExchangeRate({
            baseCurrency,
            targetCurrency,
            baseAmount,
        });
        expect(result).toMatchObject({
            success: false,
            error: { errorCode: ERROR_CODES.serviceError },
        });
    });

    it('should return invalid response error', async () => {
        process.env.EXCHANGERATE_API_URL = 'return-invalid-response';

        const result = await getExchangeRate({
            baseCurrency,
            targetCurrency,
            baseAmount,
        });
        expect(result).toMatchObject({
            success: false,
            error: { errorCode: 'ServiceError' },
        });
    });
});
