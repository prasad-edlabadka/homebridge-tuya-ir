/// <reference types="node" />
declare type LookupCallback = (err: NodeJS.ErrnoException | null, address: string, family: number) => void;
declare type LookupAllCallback = (err: NodeJS.ErrnoException | null, addresses: Array<{
    address: string;
    family: number;
}>) => void;
export declare function flushDnsCache(hostname?: string): void;
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
export declare function cachedLookup(hostname: string, options: any, cb: LookupCallback | LookupAllCallback): void;
export {};
//# sourceMappingURL=tuyaDnsCache.d.ts.map