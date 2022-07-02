/// <reference types="node" />
import EventEmitter from 'events';
import { Logger, PlatformConfig } from 'homebridge';
export declare class TuyaIRDiscovery extends EventEmitter {
    private readonly log;
    private platformConfig;
    constructor(log: Logger, platformConfig: PlatformConfig);
    startDiscovery(index: any, cb: any): void;
}
//# sourceMappingURL=TuyaIRDiscovery.d.ts.map