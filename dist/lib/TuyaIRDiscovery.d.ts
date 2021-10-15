declare const EventEmitter: any;
import { Logger } from 'homebridge';
export declare class TuyaIRDiscovery extends EventEmitter {
    private config;
    private api;
    readonly log: Logger;
    constructor(log: any, api: any);
    start(api: any, props: any, index: any, cb: any): void;
}
export {};
//# sourceMappingURL=TuyaIRDiscovery.d.ts.map