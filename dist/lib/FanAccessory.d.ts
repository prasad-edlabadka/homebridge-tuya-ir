import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { TuyaIRPlatform } from '../platform';
/**
 * Air Conditioner Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class FanAccessory {
    private readonly platform;
    private readonly accessory;
    private service;
    /**
     * These are just used to create a working example
     * You should implement your own code to track the state of your accessory
     */
    private fanStates;
    private parentId;
    private tuya;
    private powerCommand;
    private speedCommand;
    private swingCommand;
    constructor(platform: TuyaIRPlatform, accessory: PlatformAccessory);
    setup(platform: TuyaIRPlatform, accessory: PlatformAccessory): void;
    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
     */
    setOn(value: CharacteristicValue): Promise<void>;
    /**
     * Handle the "GET" requests from HomeKit
     * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
     *
     * GET requests should return as fast as possbile. A long delay here will result in
     * HomeKit being unresponsive and a bad user experience in general.
     *
     * If your device takes time to respond you should update the status of your device
     * asynchronously instead using the `updateCharacteristic` method instead.
  
     * @example
     * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
     */
    getOn(): Promise<CharacteristicValue>;
    getRotationSpeed(): Promise<CharacteristicValue>;
    setRotationSpeed(value: CharacteristicValue): Promise<void>;
    getSwingMode(): Promise<CharacteristicValue>;
    setSwingMode(value: CharacteristicValue): Promise<void>;
}
//# sourceMappingURL=FanAccessory.d.ts.map