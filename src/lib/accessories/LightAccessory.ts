import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { TuyaIRPlatform } from '../../platform';
import { BaseAccessory } from './BaseAccessory';
import { APIInvocationHelper } from '../api/APIInvocationHelper';

/**
 * Light Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LightAccessory extends BaseAccessory {
    private service: Service;
    private sendCommandAPIURL: string;

    private lightState = {
        On: false,
        brightness: 50
    };


    constructor(
        private readonly platform: TuyaIRPlatform,
        private readonly accessory: PlatformAccessory,
    ) {
        super(platform, accessory);
        this.sendCommandAPIURL = `${this.configuration.apiHost}/v1.0/iot-03/devices/${accessory.context.device.id}/commands`;

        this.accessory?.getService(this.platform.Service.AccessoryInformation)
            ?.setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.product_name)
            .setCharacteristic(this.platform.Characteristic.Model, 'Infrared Controlled Light')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);

        this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.Brightness)
            .onSet(this.setBrightness.bind(this))
            .onGet(this.getBrightness.bind(this));
    }

    private setOn(value: CharacteristicValue) {
        if((value as boolean) !== this.lightState.On) {
        const command = (value as boolean)? "PowerOn" : "PowerOff";
        this.sendLightCommand(command, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change ${this.accessory.displayName} status due to error ${body.msg}`);
            } else {
                this.log.info(`${this.accessory.displayName} is now ${(value as number) == 0 ? 'Off' : 'On'}`);
                this.lightState.On = value as boolean;
            }
        });
    }
    }

    private getOn() {
        return this.lightState.On;
    }

    private getBrightness() {
        return this.lightState.brightness;
    }

    private setBrightness(value: CharacteristicValue) {
        const command = (value as number) <= this.lightState.brightness ? "Brightness-" : "Brightness+";
        this.sendLightCommand(command, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change ${this.accessory.displayName} brightness due to error ${body.msg}`);
            } else {
                this.log.info(`${this.accessory.displayName} is brightness is now ${command === "Brightness+" ? 'increased' : 'decreased'}`);
                //this.lightState.brightness = 50;
                if (this.lightState.On) {
                    this.log.debug("Resetting slider to 50%");
                    this.service.updateCharacteristic(this.platform.Characteristic.Brightness, 50);
                }
            }
        });
    }

    private sendLightCommand(command: string, cb) {
        const commandObj = {"commands":[{"code":command,"value":1}]}
            
        APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.sendCommandAPIURL, "POST", commandObj, (body) => {
            cb(body);
        });
    }
}