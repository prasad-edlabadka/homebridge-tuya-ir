import { PlatformAccessory } from 'homebridge';
import { TuyaIRPlatform } from '../../platform';
import { BaseAccessory } from './BaseAccessory';
/**
 * Do It Yourself Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class DoItYourselfAccessory extends BaseAccessory {
    private readonly platform;
    private readonly accessory;
    constructor(platform: TuyaIRPlatform, accessory: PlatformAccessory);
    sendLearningCode(deviceId: string, remoteId: string, code: string, cb: any): void;
    fetchLearningCodes(deviceId: string, remoteId: string, cb: any): void;
}
//# sourceMappingURL=DoItYourselfAccessory.d.ts.map