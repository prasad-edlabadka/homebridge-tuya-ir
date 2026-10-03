import { PlatformConfig } from "homebridge";
import { Device } from "./Device";

export interface TuyaProject {
    clientId: string;
    secret: string;
    readonly region?: string;
}

export class TuyaIRConfiguration {
    public tuyaAPIClientId = "";
    public tuyaAPISecret = "";
    public deviceRegion = "";
    public irDeviceId = "";
    public autoFetchRemotesFromServer = true;
    public configuredRemotes: Device[] = [];
    public apiHost = "";

    public tuyaProjects: TuyaProject[] = [];
    public activeProjectIndex = 0;

    constructor(config: PlatformConfig, index: number) {
        this.tuyaAPIClientId = config.tuyaAPIClientId;
        this.tuyaAPISecret = config.tuyaAPISecret;
        this.deviceRegion = config.deviceRegion;
        this.irDeviceId = config.smartIR[index].deviceId;
        this.autoFetchRemotesFromServer = config.smartIR[index].autoFetchRemotesFromServer;
        this.configuredRemotes = config.smartIR[index].configuredRemotes?.map(v => new Device(v));

        if (Array.isArray(config.tuyaProjects) && config.tuyaProjects.length > 0) {
            this.tuyaProjects = config.tuyaProjects;
            this.tuyaAPIClientId = this.tuyaProjects[0].clientId;
            this.tuyaAPISecret = this.tuyaProjects[0].secret;
            this.deviceRegion = this.tuyaProjects[0].region || this.deviceRegion;
        }

        this.updateApiHost();
    }

    public switchToNextProject(): boolean {
        if (this.tuyaProjects.length <= 1) {
            return false;
        }

        this.activeProjectIndex =
            (this.activeProjectIndex + 1) % this.tuyaProjects.length;

        const project = this.tuyaProjects[this.activeProjectIndex];

        this.tuyaAPIClientId = project.clientId;
        this.tuyaAPISecret = project.secret;
        this.deviceRegion = project.region || this.deviceRegion;

        this.updateApiHost();

        return true;
    }

    private updateApiHost() {
        switch (this.deviceRegion) {
            case "sg":
                this.apiHost = "https://openapi-sg.iotbing.com";
                break;
            case "ueaz":
                this.apiHost = "https://openapi-ueaz.tuyaus.com";
                break;
            case "weaz":
                this.apiHost = "https://openapi-weaz.tuyaeu.com";
                break;
            default:
                this.apiHost = `https://openapi.tuya${this.deviceRegion}.com`;
        }
    }
}
