import { validCurrencyList } from '../config';
import { ErrorCodeEnum, ErrorResponse } from '../types';

const DEFAULT_ERROR_MESSAGE = 'Unknown error';

type Options = {
    errorCode?: ErrorCodeEnum | undefined;
    message?: string;
};

const suppertedCurrencyList = validCurrencyList.join(', ');

export const createErrorResponse = (options: Options): ErrorResponse => {
    const { errorCode = ErrorCodeEnum.UnknownError, message } = options;
    let errorMessage;

    switch (errorCode) {
        case ErrorCodeEnum.InvalidBaseCurrencyCode: {
            errorMessage = `Invalid base currency code. Supported currencies: ${suppertedCurrencyList}`;
            break;
        }
        case ErrorCodeEnum.InvalidTargetCurrencyCode: {
            errorMessage = `Invalid target currency code. Supported currencies: ${suppertedCurrencyList}`;
            break;
        }
        case ErrorCodeEnum.InvalidCurrencyCodePair: {
            errorMessage = `Invalid base and target currency pair`;
            break;
        }
        case ErrorCodeEnum.InvalidAmount: {
            errorMessage = `Invalid amount`;
            break;
        }
    }

    return {
        success: false,
        error: {
            errorCode,
            message: message || errorMessage || DEFAULT_ERROR_MESSAGE,
        },
    };
};
