import { AssertionError } from 'assert';
import LruCache, { CacheOptions } from '../LruCache';
import { delay } from '../../helpers/helpers';

let lru: LruCache;

beforeEach(() => {
    lru = new LruCache({
        size: 2, // capacity
        ttl: 200, // cache item will expire in 200 ms
    });
});

describe('LruCache', () => {
    describe('should throw assertion error', () => {
        const createCache = (options: CacheOptions) => () => new LruCache(options);

        it('for wrong cache size', () => {
            expect(createCache({ size: 0 })).toThrow(AssertionError);
        });

        it('for wrong TTL value', () => {
            expect(createCache({ ttl: -1 })).toThrow(AssertionError);
        });
    });

    it('should create instance', () => {
        expect(lru).toBeInstanceOf(LruCache);
    });

    it(`should put record 'one:1' to cache`, () => {
        const key = 'one';
        const val = 1;
        lru.put(key, val);
        const one = lru.get(key);
        expect(one?.value).toEqual(val);
    });

    it('should return null for non-existing key', () => {
        const nonExisting = lru.get('non-existing-key');
        expect(nonExisting).toBeNull();
    });

    it('should remove third value when size === 2', () => {
        lru.put('one', 1);
        lru.put('two', 2);
        lru.put('three', 3); // <--- this should remove oldest item 'one'
        expect(lru.get('one')).toBeNull();
    });

    it('should move accessed value to HEAD', () => {
        lru.put('one', 1);
        lru.put('two', 2);
        lru.get('one'); // <--- this should move item 'one' to HEAD position
        lru.put('three', 3); // <--- this should move item 'one' to second position
        expect(lru.get('one')).not.toBeNull();
    });

    it('should return null for expired items', async () => {
        const key = 'one';
        const value = 1;

        lru.put(key, value);
        expect(lru.get(key)).toMatchObject({ key, value }); // <-- this should return item as it's not expired yet
        await delay(201);
        expect(lru.get(key)).toBeNull(); // <-- this should return null as this item should be expired already
    });

    it('should update value', () => {
        const key = 'one';
        const val1 = 1;
        const val2 = 1111;

        lru.put(key, val1);
        expect(lru.get(key)?.value).toEqual(val1);

        lru.put(key, val2);
        expect(lru.get(key)?.value).toEqual(val2);
    });

    it('should flush cache', () => {
        const key = 'one';
        const val = 1;

        lru.put(key, val);
        expect(lru.get(key)?.value).toEqual(val);

        lru.flush();
        expect(lru.get(key)).toBeNull();
    });
});
