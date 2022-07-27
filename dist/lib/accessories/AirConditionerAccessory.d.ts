import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { TuyaIRPlatform } from '../../platform';
import { BaseAccessory } from './BaseAccessory';
/**
 * Air Conditioner Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class AirConditionerAccessory extends BaseAccessory {
    private readonly platform;
    private readonly accessory;
    private service;
    private modeList;
    private modeCode;
    private acStates;
    constructor(platform: TuyaIRPlatform, accessory: PlatformAccessory);
    /**
    * Load latest device status.
    */
    refreshStatus(): void;
    setOn(value: CharacteristicValue): void;
    getOn(): CharacteristicValue;
    setHeatingCoolingState(value: CharacteristicValue): void;
    getHeatingCoolingState(): CharacteristicValue;
    getCoolingThresholdTemperatureCharacteristic(): CharacteristicValue;
    setCoolingThresholdTemperatureCharacteristic(value: CharacteristicValue): void;
    getRotationSpeedCharacteristic(): CharacteristicValue;
    setRotationSpeedCharacteristic(value: CharacteristicValue): void;
    getCurrentTemperature(): CharacteristicValue;
    sendACCommand(deviceId: string, remoteId: string, command: string, value: string | number, cb: any): void;
    getACStatus(deviceId: string, remoteId: string, cb: any): void;
}
//# sourceMappingURL=AirConditionerAccessory.d.ts.map