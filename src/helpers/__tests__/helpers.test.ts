import { isValidAmount, isValidCurrency, isValidUrl, parseInteger, round } from '../helpers';

jest.mock('../../config', () => ({
    validCurrencyList: ['USD', 'EUR', 'GBP'] as const,
}));

describe('helper', () => {
    describe(`isValidCurrency`, () => {
        it('should return false for undefined', () => {
            // @ts-expect-error not passing an argument
            expect(isValidCurrency()).toBeFalsy();
        });
        it('should return false for XYZ', () => {
            // @ts-expect-error passing invalid currency
            expect(isValidCurrency('XYZ')).toBeFalsy();
        });
        it('should return true for EUR', () => {
            expect(isValidCurrency('EUR')).toBeTruthy();
        });
        it('should return false for lowercase eur', () => {
            // @ts-expect-error passing lowercase currency
            expect(isValidCurrency('eur')).toBeFalsy();
        });
    });

    describe(`parseInteger`, () => {
        it('should return false for undefined', () => {
            // @ts-expect-error not passing an argument
            expect(parseInteger()).toBeFalsy();
        });
        it(`should return 123 from '123'`, () => {
            expect(parseInteger('123')).toEqual(123);
        });
        it(`should return -123 from '-123'`, () => {
            expect(parseInteger('-123')).toEqual(-123);
        });
        it(`should return null for E number`, () => {
            expect(parseInteger('5e5')).toBeNull();
        });
        it(`should return null for numbers + letters`, () => {
            expect(parseInteger('123a')).toBeNull();
            expect(parseInteger('a123')).toBeNull();
        });
        it(`should return null for a float number`, () => {
            expect(parseInteger('1.234')).toBeNull();
            expect(parseInteger(1.234)).toBeNull();
        });
    });

    describe('isValidAmount', () => {
        it('should return false for undefined', () => {
            // @ts-expect-error not passing an argument
            expect(isValidAmount()).toBeFalsy();
        });
        it(`should return true for 123`, () => {
            expect(isValidAmount(123)).toBeTruthy();
        });
        it(`should parseInteger and return true for '123'`, () => {
            expect(isValidAmount('123')).toBeTruthy();
        });
        it(`should return true for Number.MAX_SAFE_INTEGER`, () => {
            expect(isValidAmount(Number.MAX_SAFE_INTEGER)).toBeTruthy();
        });
        it(`should return false for 0`, () => {
            expect(isValidAmount(0)).toBeFalsy();
        });
        it(`should return false for negative number`, () => {
            expect(isValidAmount(-100)).toBeFalsy();
        });
        it(`should parseInteger and return false for '123.123'`, () => {
            expect(isValidAmount('123.123')).toBeFalsy();
        });
    });

    describe('isValidUrl', () => {
        const urlTestList = {
            'http://example.com/path/?query=param': true,
            'https://example.com/path/?query=param': true,
            'https://127.0.0.1': true,
            'file://something': false,
            'totaly-not-url': false,
            'http://@': false,
            '': false,
        };

        Object.entries(urlTestList).forEach(([url, result]) => {
            it(`should return ${result ? 'true' : 'false'} for '${url}'`, () => {
                expect(isValidUrl(url)).toEqual(result);
            });
        });
    });

    describe('round', () => {
        it(`should round 0.12345 to 0.123`, () => {
            expect(round(0.12345, 3)).toEqual(0.123);
        });
        it(`should round 0.12345 to 0.1235`, () => {
            expect(round(0.12345, 4)).toEqual(0.1235);
        });
        it(`should round 0.175 to 0.18`, () => {
            // this fails with .toFixed()
            expect(round(0.175, 2)).toEqual(0.18);
        });
    });
});
