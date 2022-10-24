"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FanAccessory = void 0;
const BaseAccessory_1 = require("./BaseAccessory");
const APIInvocationHelper_1 = require("../api/APIInvocationHelper");
/**
 * Fan Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class FanAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, accessory) {
        var _a, _b;
        super(platform, accessory);
        this.platform = platform;
        this.accessory = accessory;
        this.fanStates = {
            On: this.platform.Characteristic.Active.INACTIVE,
            speed: 50,
            fan: 0,
            swing: this.platform.Characteristic.SwingMode.SWING_DISABLED
        };
        this.powerCommand = 1;
        this.speedCommand = 9367;
        this.swingCommand = 9372;
        this.sendCommandAPIURL = accessory.context.device.diy ? `${this.configuration.apiHost}/v2.0/infrareds/${this.parentId}/remotes/${accessory.context.device.id}/learning-codes` : `${this.configuration.apiHost}/v1.0/infrareds/${this.parentId}/remotes/${accessory.context.device.id}/raw/command`;
        this.sendCommandKey = accessory.context.device.diy ? 'code' : 'raw_key';
        (_b = (_a = this.accessory) === null || _a === void 0 ? void 0 : _a.getService(this.platform.Service.AccessoryInformation)) === null || _b === void 0 ? void 0 : _b.setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.product_name).setCharacteristic(this.platform.Characteristic.Model, 'Infrared Controlled Fan').setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);
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
                this.log.debug(`Setting DIY Commands for Fan as ${JSON.stringify(commands)}`);
                this.powerCommand = commands.power;
                this.speedCommand = commands.speed;
                this.swingCommand = commands.swing;
            }
            else {
                this.log.warn(`Failed to get commands for the fan. Defaulting to standard values. These may not work.`);
            }
        });
    }
    setOn(value) {
        if (this.fanStates.On != value) {
            this.sendFanCommand(this.powerCommand, (body) => {
                if (!body.success) {
                    this.log.error(`Failed to change Fan status due to error ${body.msg}`);
                }
                else {
                    this.log.info(`${this.accessory.displayName} is now ${value == 0 ? 'Off' : 'On'}`);
                    this.fanStates.On = value;
                    if (this.fanStates.On) {
                        this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, 50);
                    }
                }
            });
        }
    }
    getOn() {
        return this.fanStates.On;
    }
    getRotationSpeed() {
        return this.fanStates.speed;
    }
    setRotationSpeed() {
        this.sendFanCommand(this.speedCommand, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change Fan speed due to error ${body.msg}`);
            }
            else {
                this.log.info(`${this.accessory.displayName} speed is updated.`);
                this.fanStates.speed = 50;
                this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, 50);
            }
        });
    }
    getSwingMode() {
        return this.fanStates.swing;
    }
    setSwingMode(value) {
        this.sendFanCommand(this.swingCommand, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change Fan swing due to error ${body.msg}`);
            }
            else {
                this.log.info(`${this.accessory.displayName} swing is updated.`);
                this.fanStates.swing = value;
            }
        });
    }
    getFanCommands(irDeviceId, remoteId, isDiy = false, callback) {
        this.log.debug("Getting commands for Fan...");
        if (isDiy) {
            this.log.debug("Getting commands for DIY Fan...");
            APIInvocationHelper_1.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + `/v2.0/infrareds/${irDeviceId}/remotes/${remoteId}/learning-codes`, "GET", {}, (codesBody) => {
                if (codesBody.success) {
                    this.log.debug("Received codes. Returning all available codes");
                    callback(this.getIRCodesFromAPIResponse(codesBody));
                }
                else {
                    this.log.error("Failed to get codes for DIY Fan", codesBody.msg);
                    callback();
                }
            });
        }
        else {
            this.log.debug("First getting brand id and remote id for given device...");
            APIInvocationHelper_1.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, `${this.configuration.apiHost}/v2.0/infrareds/${irDeviceId}/remotes/${remoteId}/keys`, 'GET', {}, (body) => {
                if (body.success) {
                    this.log.debug(`Found category id: ${body.result.category_id}, brand id: ${body.result.brand_id}, remote id: ${body.result.remote_index}`);
                    APIInvocationHelper_1.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + `/v2.0/infrareds/${irDeviceId}/categories/${body.result.category_id}/brands/${body.result.brand_id}/remotes/${body.result.remote_index}/rules`, "GET", {}, (codesBody) => {
                        if (codesBody.success) {
                            this.log.debug("Received codes. Returning all available codes");
                            callback(this.getIRCodesFromAPIResponse(codesBody));
                        }
                        else {
                            this.log.warn("Failed to get custom codes for fan. Trying to use standard codes...", codesBody.msg);
                            callback(this.getStandardIRCodesFromAPIResponse(body));
                        }
                    });
                }
                else {
                    this.log.error("Failed to get fan key details", body.msg);
                    callback();
                }
            });
        }
    }
    sendFanCommand(command, cb) {
        const commandObj = { [this.sendCommandKey]: command };
        APIInvocationHelper_1.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.sendCommandAPIURL, "POST", commandObj, (body) => {
            cb(body);
        });
    }
    getIRCodeFromKey(item, key) {
        if (item.key_name === key) {
            return item.key_id || item.key;
        }
    }
    getIRCodesFromAPIResponse(apiResponse) {
        const ret = { power: this.powerCommand, speed: this.speedCommand, swing: this.swingCommand };
        for (let i = 0; i < apiResponse.result.length; i++) {
            const codeItem = apiResponse.result[i];
            ret.power = ret.power || this.getIRCodeFromKey(codeItem, "power");
            ret.speed = ret.speed || this.getIRCodeFromKey(codeItem, "fan_speed");
            ret.swing = ret.swing || this.getIRCodeFromKey(codeItem, "swing");
        }
        return ret;
    }
    getStandardIRCodesFromAPIResponse(apiResponse) {
        const ret = { power: null, speed: null, swing: null };
        for (let i = 0; i < apiResponse.result.key_list.length; i++) {
            const codeItem = apiResponse.result.key_list[i];
            ret.power = ret.power || this.getIRCodeFromKey(codeItem, "power");
            ret.speed = ret.speed || this.getIRCodeFromKey(codeItem, "fan_speed");
            ret.swing = ret.swing || this.getIRCodeFromKey(codeItem, "swing");
        }
        return ret;
    }
}
exports.FanAccessory = FanAccessory;
//# sourceMappingURL=FanAccessory.js.map