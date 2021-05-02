import { validCurrencyList } from './config';

export type Currency = typeof validCurrencyList[number];

export enum ErrorCodeEnum {
    InvalidBaseCurrencyCode = 'InvalidBaseCurrencyCode',
    InvalidTargetCurrencyCode = 'InvalidTargetCurrencyCode',
    InvalidCurrencyCodePair = 'InvalidCurrencyCodePair',
    InvalidAmount = 'InvalidAmount',
    InvalidUrl = 'InvalidUrl',
    RequestFailed = 'RequestFailed',
    ServiceError = 'ServiceError',
    UnknownError = 'UnknownError',
}

export type ErrorType = {
    errorCode: ErrorCodeEnum;
    message?: string;
    statusCode?: number;
};

export type ErrorResponse = {
    success: false;
    error?: ErrorType;
};

export type Response = {
    success: boolean;
    error?: ErrorType;
    result?: any;
};
