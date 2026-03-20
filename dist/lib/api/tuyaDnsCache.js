"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cachedLookup = exports.flushDnsCache = void 0;
const node_dns_1 = __importDefault(require("node:dns"));
// Policy TTL: Node doesn't expose authoritative DNS TTL via dns.lookup().
// Keep conservative to avoid pinning to a bad Tuya LB IP for too long.
const CACHE_TTL_MS = 60000;
// Cache per hostname + family (avoid mixing IPv4/IPv6 results).
const cache = new Map();
function makeKey(hostname, family) {
    return `${hostname}|${family}`;
}
function flushDnsCache(hostname) {
    if (!hostname) {
        cache.clear();
        return;
    }
    cache.delete(makeKey(hostname, 4));
    cache.delete(makeKey(hostname, 6));
}
exports.flushDnsCache = flushDnsCache;
/**
 * Drop-in `lookup` function for https.request({ lookup }).
 *
 * Node may call lookup in two different "modes":
 *  - all: false  => cb(err, address, family)
 *  - all: true   => cb(err, addresses[])
 *
 * If we respond with the wrong callback shape, Node can end up throwing:
 *  "Invalid IP address: undefined"
 */
function cachedLookup(hostname, options, cb) {
    const wantsAll = !!(options && typeof options === 'object' && options.all);
    let requestedFamily = 0;
    if (typeof options === 'number') {
        requestedFamily = options;
    }
    else if (typeof (options === null || options === void 0 ? void 0 : options.family) === 'number') {
        requestedFamily = options.family;
    }
    // Default to IPv4 if family isn't specified.
    const effectiveFamily = requestedFamily === 0 ? 4 : requestedFamily;
    const now = Date.now();
    const key = makeKey(hostname, effectiveFamily);
    const hit = cache.get(key);
    if (hit && hit.expiresAt > now) {
        if (wantsAll) {
            cb(null, [{ address: hit.address, family: hit.family }]);
        }
        else {
            cb(null, hit.address, hit.family);
        }
        return;
    }
    // Always resolve a single address; if Node asked for "all", wrap it into an array.
    node_dns_1.default.lookup(hostname, { family: effectiveFamily, all: false }, (err, address, family) => {
        if (err || typeof address !== 'string' || address.length === 0) {
            cache.delete(key);
            const e = err ||
                Object.assign(new Error(`DNS lookup returned no address for ${hostname}`), {
                    code: 'EAI_NODATA',
                });
            if (wantsAll) {
                cb(e, []);
            }
            else {
                // Must NOT pass undefined here; Node can throw before handling err.
                cb(e, '0.0.0.0', effectiveFamily);
            }
            return;
        }
        cache.set(key, {
            address,
            family,
            expiresAt: now + CACHE_TTL_MS,
        });
        if (wantsAll) {
            cb(null, [{ address, family }]);
        }
        else {
            cb(null, address, family);
        }
    });
}
exports.cachedLookup = cachedLookup;
//# sourceMappingURL=tuyaDnsCache.js.map