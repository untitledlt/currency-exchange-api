import { fetchJson } from '../helpers/fetch';
import logger from '../helpers/logger';
import { Currency, ErrorCodeEnum, Response } from '../types';

export type ExchangeRateOptions = {
    baseCurrency: Currency;
    targetCurrency: Currency;
    baseAmount: number;
};

export type ExchangeRateResult = {
    conversionRate: number;
};

type ExchangerateApiResponse = {
    result?: string;
    base_code?: string;
    target_code?: string;
    conversion_rate?: number;
};

const isValidResponse = ({
    baseCurrency,
    targetCurrency,
    response,
}: {
    baseCurrency: Currency;
    targetCurrency: Currency;
    response: ExchangerateApiResponse | undefined;
}) => {
    const { result, base_code, target_code, conversion_rate } = response || {};
    return (
        result === 'success' &&
        base_code === baseCurrency &&
        target_code === targetCurrency &&
        typeof conversion_rate === 'number' &&
        Number.isFinite(conversion_rate) &&
        conversion_rate > 0
    );
};

export const getExchangeRate = async (options: ExchangeRateOptions): Promise<Response> => {
    const { baseCurrency, targetCurrency, baseAmount } = options;
    // prettier-ignore
    const url = process.env.EXCHANGERATE_API_URL!
        .replace('{{API_KEY}}', process.env.EXCHANGERATE_API_KEY!)
        .replace('{{FROM}}', baseCurrency)
        .replace('{{TO}}', targetCurrency);
    logger.debug('Making service request with url %s', url);

    const { success, error, result } = await fetchJson<ExchangerateApiResponse>(url);

    if (!success) {
        logger.error('Service request failed %j', error);
        return {
            success: false,
            error,
        };
    }

    if (!isValidResponse({ baseCurrency, targetCurrency, response: result })) {
        // log invalid response but do not relay actual error
        logger.error('Got invalid service response: %j', result);
        return {
            success: false,
            error: {
                errorCode: ErrorCodeEnum.ServiceError,
            },
        };
    }

    logger.debug('Got service response: %j', result);

    return {
        success: true,
        result: {
            conversionRate: result?.conversion_rate!,
        },
    };
};
