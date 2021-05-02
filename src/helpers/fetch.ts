import nodeFetch, { RequestInit } from 'node-fetch';
import { ErrorCodeEnum, ErrorResponse, Response } from '../types';
import { isValidUrl } from './helpers';
import logger from './logger';

const getFailedResult = (errorCode: ErrorCodeEnum): ErrorResponse => ({
    success: false,
    error: {
        errorCode,
    },
});

export const fetchJson = async <T>(
    url: string,
    options?: RequestInit | undefined
): Promise<Response & { result?: T }> => {
    if (!isValidUrl(url)) {
        return getFailedResult(ErrorCodeEnum.InvalidUrl);
    }
    try {
        const response = await nodeFetch(url, options);
        if (!response.ok) {
            logger.error('FetchJson request error: %j', response);
            return getFailedResult(ErrorCodeEnum.ServiceError);
        } else {
            return {
                success: true,
                result: (await response.json()) as T,
            };
        }
    } catch (err) {
        logger.error('FetchJson request error: %j', err);
        return getFailedResult(ErrorCodeEnum.RequestFailed);
    }
};
