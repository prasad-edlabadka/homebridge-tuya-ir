import dns from 'node:dns';

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string,
  family: number,
) => void;

type LookupAllCallback = (
  err: NodeJS.ErrnoException | null,
  addresses: Array<{ address: string; family: number }>,
) => void;

type CacheEntry = {
  address: string;
  family: number;
  expiresAt: number;
};

// Policy TTL: Node doesn't expose authoritative DNS TTL via dns.lookup().
// Keep conservative to avoid pinning to a bad Tuya LB IP for too long.
const CACHE_TTL_MS = 60_000;

// Cache per hostname + family (avoid mixing IPv4/IPv6 results).
const cache = new Map<string, CacheEntry>();

function makeKey(hostname: string, family: number) {
  return `${hostname}|${family}`;
}

export function flushDnsCache(hostname?: string) {
  if (!hostname) {
    cache.clear();
    return;
  }
  cache.delete(makeKey(hostname, 4));
  cache.delete(makeKey(hostname, 6));
}

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
export function cachedLookup(
  hostname: string,
  options: any,
  cb: LookupCallback | LookupAllCallback,
) {
  const wantsAll = !!(options && typeof options === 'object' && options.all);

  let requestedFamily = 0;
  if (typeof options === 'number') {
    requestedFamily = options;
  } else if (typeof options?.family === 'number') {
    requestedFamily = options.family;
  }

  // Default to IPv4 if family isn't specified.
  const effectiveFamily = requestedFamily === 0 ? 4 : requestedFamily;

  const now = Date.now();
  const key = makeKey(hostname, effectiveFamily);
  const hit = cache.get(key);

  if (hit && hit.expiresAt > now) {
    if (wantsAll) {
      (cb as LookupAllCallback)(null, [{ address: hit.address, family: hit.family }]);
    } else {
      (cb as LookupCallback)(null, hit.address, hit.family);
    }
    return;
  }

  // Always resolve a single address; if Node asked for "all", wrap it into an array.
  dns.lookup(hostname, { family: effectiveFamily, all: false }, (err, address, family) => {
    if (err || typeof address !== 'string' || address.length === 0) {
      cache.delete(key);

      const e: NodeJS.ErrnoException =
        err ||
        Object.assign(new Error(`DNS lookup returned no address for ${hostname}`), {
          code: 'EAI_NODATA',
        });

      if (wantsAll) {
        (cb as LookupAllCallback)(e, []);
      } else {
        // Must NOT pass undefined here; Node can throw before handling err.
        (cb as LookupCallback)(e, '0.0.0.0', effectiveFamily);
      }
      return;
    }

    cache.set(key, {
      address,
      family,
      expiresAt: now + CACHE_TTL_MS,
    });

    if (wantsAll) {
      (cb as LookupAllCallback)(null, [{ address, family }]);
    } else {
      (cb as LookupCallback)(null, address, family);
    }
  });
}
