import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { TuyaIRPlatform } from '../../platform';
import { APIInvocationHelper } from '../api/APIInvocationHelper';
import { BaseAccessory } from './BaseAccessory';

/**
 * Generic Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class GenericAccessory extends BaseAccessory {
    private service: Service;
    private switchStates = {
        On: this.platform.Characteristic.Active.INACTIVE
    };

    private powerCommand = 1;
    private sendCommandAPIURL: string;

    constructor(
        private readonly platform: TuyaIRPlatform,
        private readonly accessory: PlatformAccessory,
    ) {
        super(platform, accessory);
        this.sendCommandAPIURL = `${this.configuration.apiHost}/v2.0/infrareds/${this.parentId}/remotes/${accessory.context.device.id}/raw/command`;
        
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            ?.setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.product_name)
            .setCharacteristic(this.platform.Characteristic.Model, 'Infrared Controlled Switch')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);

        this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));
    }

    setOn(value: CharacteristicValue) {
        if (this.switchStates.On != (value as number)) {
            this.sendCommand(this.powerCommand, (body) => {
                if (!body.success) {
                    this.log.error(`Failed to change device status due to error ${body.msg}`);
                } else {
                    this.log.info(`${this.accessory.displayName} is now ${(value as number) == 0 ? 'Off' : 'On'}`);
                    this.switchStates.On = value as number;
                }
            });
        }
    }

    getOn(): CharacteristicValue {
        return this.switchStates.On;
    }

    private sendCommand(command: string | number, cb) {
        const commandObj = { 'raw_key': command };
        APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.sendCommandAPIURL, "POST", commandObj, (body) => {
            cb(body);
        });
    }
}
