import { Logger } from "homebridge";
import { TuyaIRConfiguration } from "../model/TuyaIRConfiguration";
import { BaseHelper } from "./BaseHelper";
export declare class DeviceConfigurationHelper extends BaseHelper {
    private static _instance;
    private constructor();
    static Instance(config: TuyaIRConfiguration, log: Logger): DeviceConfigurationHelper;
    fetchDevices(deviceId: string): Promise<unknown>;
    private manualFetch;
    private autoFetch;
    private fetchRemoteDetails;
}
//# sourceMappingURL=DeviceConfigurationHelper.d.ts.map