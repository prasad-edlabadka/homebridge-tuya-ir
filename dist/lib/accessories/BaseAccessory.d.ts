import { Logger, PlatformAccessory } from "homebridge";
import { TuyaIRPlatform } from "../../platform";
import { TuyaIRConfiguration } from "../model/TuyaIRConfiguration";
export declare class BaseAccessory {
    protected parentId: string;
    protected configuration: TuyaIRConfiguration;
    protected log: Logger;
    constructor(platform: TuyaIRPlatform, accessory: PlatformAccessory);
}
//# sourceMappingURL=BaseAccessory.d.ts.map