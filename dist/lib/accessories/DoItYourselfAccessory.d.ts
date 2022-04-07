import { PlatformAccessory } from 'homebridge';
import { TuyaIRPlatform } from '../../platform';
/**
 * Do It Yourself Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class DoItYourselfAccessory {
    private readonly platform;
    private readonly accessory;
    private tuya;
    constructor(platform: TuyaIRPlatform, accessory: PlatformAccessory);
}
//# sourceMappingURL=DoItYourselfAccessory.d.ts.map