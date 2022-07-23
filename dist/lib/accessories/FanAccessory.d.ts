import { PlatformAccessory } from 'homebridge';
import { TuyaIRPlatform } from '../../platform';
import { BaseAccessory } from './BaseAccessory';
/**
 * Fan Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class FanAccessory extends BaseAccessory {
    private readonly platform;
    private readonly accessory;
    private service;
    private sendCommandAPIURL;
    private sendCommandKey;
    private fanStates;
    private powerCommand;
    private speedCommand;
    private swingCommand;
    constructor(platform: TuyaIRPlatform, accessory: PlatformAccessory);
    private setOn;
    private getOn;
    private getRotationSpeed;
    private setRotationSpeed;
    private getSwingMode;
    private setSwingMode;
    private getFanCommands;
    private sendFanCommand;
    private getIRCodeFromKey;
    private getIRCodesFromAPIResponse;
    private getStandardIRCodesFromAPIResponse;
}
//# sourceMappingURL=FanAccessory.d.ts.map