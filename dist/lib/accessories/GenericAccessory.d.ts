import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { TuyaIRPlatform } from '../../platform';
import { BaseAccessory } from './BaseAccessory';
/**
 * Generic Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class GenericAccessory extends BaseAccessory {
    private readonly platform;
    private readonly accessory;
    private service;
    private switchStates;
    private powerCommand;
    private sendCommandAPIURL;
    constructor(platform: TuyaIRPlatform, accessory: PlatformAccessory);
    setOn(value: CharacteristicValue): void;
    getOn(): CharacteristicValue;
    private sendCommand;
}
//# sourceMappingURL=GenericAccessory.d.ts.map