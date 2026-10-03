import { PlatformConfig } from "homebridge";
import { Device } from "./Device";
export interface TuyaProject {
    clientId: string;
    secret: string;
    readonly region?: string;
}
export declare class TuyaIRConfiguration {
    tuyaAPIClientId: string;
    tuyaAPISecret: string;
    deviceRegion: string;
    irDeviceId: string;
    autoFetchRemotesFromServer: boolean;
    configuredRemotes: Device[];
    apiHost: string;
    tuyaProjects: TuyaProject[];
    activeProjectIndex: number;
    constructor(config: PlatformConfig, index: number);
    switchToNextProject(): boolean;
    private updateApiHost;
}
//# sourceMappingURL=TuyaIRConfiguration.d.ts.map