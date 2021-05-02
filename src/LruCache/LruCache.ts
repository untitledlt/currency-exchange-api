import assert from 'assert';
import logger from '../helpers/logger';

const DEFAULT_SIZE = 2;
const DEFAULT_TTL = 1000 * 60 * 5; // 5 mins

export type CacheOptions = {
    size?: number;
    ttl?: number;
};

type Key = string;

type HashMapItem = {
    left: HashMapItem | null;
    right: HashMapItem | null;
    timestamp: number;
    key: Key;
    value: any;
};

type HashMap = Record<string, HashMapItem>;

type ReturnType = {
    key: Key;
    value: any;
    timestamp: number;
} | null;

class LruCache {
    private size: number;
    private ttl: number;
    private count: number = 0;
    private hashMap: HashMap = {};
    private head: HashMapItem | null = null;
    private tail: HashMapItem | null = null;

    public constructor({ size = DEFAULT_SIZE, ttl = DEFAULT_TTL }: CacheOptions) {
        assert(
            Number.isSafeInteger(size) && size > 0,
            `Size must be between 1 and ${Number.MAX_SAFE_INTEGER}`
        );
        this.size = size;

        assert(
            Number.isSafeInteger(ttl) && ttl >= 0,
            `TTL must be between 0 (disabled) and ${Number.MAX_SAFE_INTEGER}`
        );
        this.ttl = ttl;
        logger.debug(`Initializing LRU cache with %j`, { size, ttl });
    }

    private moveToHead(obj: HashMapItem) {
        // do nothing if item is HEAD already
        if (obj === this.head) {
            return;
        }

        const { left, right } = obj;

        // remove item from it's current position
        if (left) {
            left.right = right;
        }
        if (right) {
            right.left = left;
        }

        // if item is TAIL, reset tail
        if (obj === this.tail) {
            this.tail = left;
        }

        // HEAD item does not have left
        obj.left = null;

        // move old HEAD to second position
        obj.right = this.head;

        if (this.head) {
            // put new item in front of old HEAD
            this.head.left = obj;
        }

        this.head = obj;
    }

    private getByKey(key: Key) {
        return (this.hashMap.hasOwnProperty(key) && this.hashMap[key]) || null;
    }

    public get(key: Key): ReturnType {
        const obj = this.getByKey(key);

        if (obj) {
            const isExpired = this.ttl > 0 && Date.now() - obj.timestamp > this.ttl;
            if (isExpired) {
                logger.debug(
                    "Item with key %s found in cache but it's expired. Returning null.",
                    key
                );
                return null;
            }

            if (this.head !== obj) {
                logger.debug('Item with key %s found in cache. Moving it to HEAD', key);
                this.moveToHead(obj);
            } else {
                logger.debug("Item with key %s found in cache and it's in HEAD already", key);
            }

            logger.debug('Returning cached item %j', obj);
            const { value, timestamp } = obj;
            return {
                key,
                value,
                timestamp,
            };
        }
        return null;
    }

    public put(key: Key, value: any) {
        logger.debug('Adding record with key %s to cache', key);
        if (this.count < this.size) {
            this.count++;
        } else {
            // cache is full

            // special case for LRU cache with capacity 1
            if (this.size === 1) {
                // this could be better optimized
                // f.e. by comparing current record and flushing only if it differs
                // or updating it but cache with capacity 1 does not make any sense
                this.flush();
            }

            if (this.tail?.left) {
                // remove TAIL ref from second-last item
                this.tail.left.right = null;

                const newTail = this.tail.left;
                delete this.hashMap[this.tail.key];
                logger.debug('Deleted key %s from cache', this.tail.key);
                this.tail = newTail;
            }
        }

        // if cache key exists, update it and move to HEAD
        const existing = this.getByKey(key);
        if (existing) {
            this.moveToHead(existing);
            existing.timestamp = Date.now();
            existing.value = value;
            return;
        }

        const obj = {
            left: null,
            right: this.head,
            timestamp: Date.now(),
            key,
            value,
        };

        if (this.head) {
            // move current HEAD to second position
            this.head.left = obj;
        }

        this.head = obj;

        this.hashMap[key] = obj;

        // TAIL is set only on first .put() call
        if (this.count === 1) {
            this.tail = obj;
        }
    }

    public flush() {
        this.hashMap = {};
        this.head = null;
        this.tail = null;
        this.count = 0;
        logger.debug('Fulshing LRU cache');
    }

    /* istanbul ignore next */
    public debug() {
        let i = 0;
        let next = this.head;
        let prev = null;
        while (next) {
            const isExpired = this.ttl > 0 && Date.now() - next.timestamp > this.ttl;

            process.stdout.write('\n\n');
            if (next === this.head) {
                process.stdout.write('HEAD    ');
            }

            process.stdout.write(next.left?.key ? ` ${next.left?.key}` : ' ');
            process.stdout.write(`<[ ${isExpired ? '!!!' : ''}${next.key} ]>`);
            process.stdout.write(next.right?.key ? `${next.right?.key} ` : ' ');

            process.stdout.write('   ');

            if (next === this.tail) {
                process.stdout.write('TAIL');
            }
            process.stdout.write('\n\n');

            prev = next;
            next = next.right;
        }
    }
}

export default LruCache;
