import { PlatformConfig } from "homebridge";
import { Device } from "./Device";

export class TuyaIRConfiguration {
    public tuyaAPIClientId = "";
    public tuyaAPISecret = "";
    public deviceRegion = "";
    public irDeviceId = "";
    public autoFetchRemotesFromServer = true;
    public configuredRemotes: Device[] = [];
    public apiHost = "";

    constructor(config: PlatformConfig, index: number) {
        Object.assign(this, config);
        this.irDeviceId = config.smartIR[index].deviceId;
        this.autoFetchRemotesFromServer = config.smartIR[index].autoFetchRemotesFromServer;
        this.configuredRemotes = config.smartIR[index].configuredRemotes?.map(v => new Device(v));
        this.apiHost = `https://openapi.tuya${this.deviceRegion}.com`;
    }
}
