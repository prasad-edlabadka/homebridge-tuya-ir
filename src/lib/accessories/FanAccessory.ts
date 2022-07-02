import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { TuyaIRPlatform } from '../../platform';
import { BaseAccessory } from './BaseAccessory';
import { APIInvocationHelper } from '../api/APIInvocationHelper';

/**
 * Fan Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class FanAccessory extends BaseAccessory {
    private service: Service;
    private sendCommandAPIURL: string;
    private sendCommandKey: string;

    private fanStates = {
        On: this.platform.Characteristic.Active.INACTIVE,
        speed: 50,
        fan: 0,
        swing: this.platform.Characteristic.SwingMode.SWING_DISABLED
    };

    private powerCommand = 1;
    private speedCommand = 9367;
    private swingCommand = 9372;

    constructor(
        private readonly platform: TuyaIRPlatform,
        private readonly accessory: PlatformAccessory,
    ) {
        super(platform, accessory);
        this.sendCommandAPIURL = accessory.context.device.diy ? `${this.configuration.apiHost}/v1.0/infrareds/${this.parentId}/remotes/${accessory.context.device.id}/learning-codes` : `${this.configuration.apiHost}/v1.0/infrareds/${this.parentId}/remotes/${accessory.context.device.id}/raw/command`;
        this.sendCommandKey = accessory.context.device.diy ? 'code' : 'raw_key';

        this.accessory?.getService(this.platform.Service.AccessoryInformation)
            ?.setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.product_name)
            .setCharacteristic(this.platform.Characteristic.Model, 'Infrared Controlled Fan')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);

        this.service = this.accessory.getService(this.platform.Service.Fanv2) || this.accessory.addService(this.platform.Service.Fanv2);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

        this.service.getCharacteristic(this.platform.Characteristic.Active)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .onSet(this.setRotationSpeed.bind(this))
            .onGet(this.getRotationSpeed.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.SwingMode)
            .onSet(this.setSwingMode.bind(this))
            .onGet(this.getSwingMode.bind(this));

        this.getFanCommands(this.parentId, accessory.context.device.id, accessory.context.device.diy, (commands) => {
            if (commands) {
                this.powerCommand = commands.power;
                this.speedCommand = commands.speed;
                this.swingCommand = commands.swing;
            } else {
                this.log.warn(`Failed to get commands for the fan. Defaulting to standard values. These may not work.`);
            }
        })
    }

    private setOn(value: CharacteristicValue) {
        if (this.fanStates.On != (value as number)) {
            this.sendFanCommand(this.powerCommand, (body) => {
                if (!body.success) {
                    this.log.error(`Failed to change Fan status due to error ${body.msg}`);
                } else {
                    this.log.info(`${this.accessory.displayName} is now ${(value as number) == 0 ? 'Off' : 'On'}`);
                    this.fanStates.On = value as number;
                    if (this.fanStates.On) {
                        this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, 50);
                    }
                }
            });
        }
    }

    private getOn() {
        return this.fanStates.On;
    }

    private getRotationSpeed() {
        return this.fanStates.speed;
    }

    private setRotationSpeed() {
        this.sendFanCommand(this.speedCommand, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change Fan speed due to error ${body.msg}`);
            } else {
                this.log.info(`${this.accessory.displayName} speed is updated.`);
                this.fanStates.speed = 50;
                this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, 50);
            }
        });
    }

    private getSwingMode() {
        return this.fanStates.swing;
    }

    private setSwingMode(value: CharacteristicValue) {
        this.sendFanCommand(this.swingCommand, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change Fan swing due to error ${body.msg}`);
            } else {
                this.log.info(`${this.accessory.displayName} swing is updated.`);
                this.fanStates.swing = (value as number);
            }
        });
    }

    private getFanCommands(irDeviceId: string, remoteId: string, isDiy = false, callback) {
        this.log.debug("Getting commands for Fan...");
        if (isDiy) {
            this.log.debug("Getting commands for DIY Fan...");
            APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + `/v1.0/infrareds/${irDeviceId}/remotes/${remoteId}/learning-codes`, "GET", {}, (codesBody) => {
                if (codesBody.success) {
                    this.log.debug("Received codes. Returning all available codes");
                    callback(this.getIRCodesFromAPIResponse(codesBody));
                } else {
                    this.log.error("Failed to invoke API", codesBody.msg);
                    callback();
                }
            });
        } else {
            this.log.debug("First getting brand id and remote id for given device...");
            APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, `${this.configuration.apiHost}/v1.0/infrareds/${irDeviceId}/remotes/${remoteId}/keys`, 'GET', {}, (body) => {
                if (body.success) {
                    this.log.debug(`Found category id: ${body.result.category_id}, brand id: ${body.result.brand_id}, remote id: ${body.result.remote_index}`);
                    APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + `/v1.0/infrareds/${irDeviceId}/categories/${body.result.category_id}/brands/${body.result.brand_id}/remotes/${body.result.remote_index}/rules`, "GET", {}, (codesBody) => {
                        if (codesBody.success) {
                            this.log.debug("Received codes. Returning all available codes");
                            callback(this.getIRCodesFromAPIResponse(codesBody));
                        } else {
                            this.log.error("Failed to invoke API", codesBody.msg);
                            callback();
                        }
                    });
                } else {
                    this.log.error("Failed to invoke API", body.msg);
                    callback();
                }
            });
        }
    }

    private sendFanCommand(command: string | number, cb) {
        const commandObj = { [this.sendCommandKey]: command };
        APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.sendCommandAPIURL, "POST", commandObj, (body) => {
            cb(body);
        });
    }

    private getIRCodeFromKey(item, key: string) {
        if (item.key_name === key) {
            return item.key;
        }
    }

    private getIRCodesFromAPIResponse(apiResponse) {
        const ret = { power: null, speed: null, swing: null };
        for (let i = 0; i < apiResponse.result.length; i++) {
            const codeItem = apiResponse.result[i];
            ret.power = ret.power || this.getIRCodeFromKey(codeItem, "power");
            ret.speed = ret.speed || this.getIRCodeFromKey(codeItem, "fan_speed");
            ret.swing = ret.swing || this.getIRCodeFromKey(codeItem, "swing");
        }
        return ret;
    }
}