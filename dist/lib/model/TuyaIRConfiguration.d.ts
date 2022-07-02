import { PlatformConfig } from "homebridge";
import { Device } from "./Device";
export declare class TuyaIRConfiguration {
    tuyaAPIClientId: string;
    tuyaAPISecret: string;
    deviceRegion: string;
    irDeviceId: string;
    autoFetchRemotesFromServer: boolean;
    configuredRemotes: Device[];
    apiHost: string;
    constructor(config: PlatformConfig, index: number);
}
//# sourceMappingURL=TuyaIRConfiguration.d.ts.map