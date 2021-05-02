import { validCurrencyList } from '../config';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isTest = () => process.env.NODE_ENV === 'test';
export const isProd = () => process.env.NODE_ENV === 'production';
export const isDev = () => !isTest() && !isProd();

export const isValidCurrency = (code: typeof validCurrencyList[number] | null | undefined) =>
    !!code && validCurrencyList.includes(code);

export const parseInteger = (input: number | string | undefined): number | null => {
    if (typeof input === 'number' && Number.isInteger(input)) {
        return input;
    } else if (typeof input === 'string') {
        const amount = parseInt(input);
        return input === `${amount}` ? amount : null;
    }
    return null;
};

export const isValidAmount = (input: number | string | null | undefined) => {
    if (typeof input === 'undefined' || input === null) {
        return false;
    }

    let amount = parseInteger(input);
    return amount !== null && Number.isSafeInteger(amount) && amount > 0;
};

export const isValidUrl = (input: string) => {
    let url;
    try {
        url = new URL(input);
        return url.protocol.startsWith('http');
    } catch (err) {
        return false;
    }
};

// at this point I would use some lib like lodash.round
// but let's reinvent the wheel this time :)
// .toFixed() fails in some cases like (0.175).toFixed(2)
// rounding to integer and dividing fixes this
export const round = (value: number, precision: number = 0) => {
    // @ts-ignore
    return Number(Math.round(value + 'e' + precision) + 'e-' + precision);
};
