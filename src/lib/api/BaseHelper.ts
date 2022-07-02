import { Logger } from "homebridge";
import { TuyaIRConfiguration } from "../model/TuyaIRConfiguration";

export class BaseHelper {
    protected apiHost: string;

    constructor(protected config: TuyaIRConfiguration, protected log: Logger) {
        this.apiHost = `https://openapi.tuya${this.config.deviceRegion}.com`;
    }

}