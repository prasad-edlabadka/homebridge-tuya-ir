"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericAccessory = void 0;
const APIInvocationHelper_1 = require("../api/APIInvocationHelper");
const BaseAccessory_1 = require("./BaseAccessory");
/**
 * Generic Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class GenericAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, accessory) {
        var _a;
        super(platform, accessory);
        this.platform = platform;
        this.accessory = accessory;
        this.switchStates = {
            On: this.platform.Characteristic.Active.INACTIVE
        };
        this.powerCommand = 1;
        this.sendCommandAPIURL = `${this.configuration.apiHost}/v1.0/infrareds/${this.parentId}/remotes/${accessory.context.device.id}/raw/command`;
        // set accessory information
        (_a = this.accessory.getService(this.platform.Service.AccessoryInformation)) === null || _a === void 0 ? void 0 : _a.setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.product_name).setCharacteristic(this.platform.Characteristic.Model, 'Infrared Controlled Switch').setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);
        this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));
    }
    setOn(value) {
        if (this.switchStates.On != value) {
            this.sendCommand(this.powerCommand, (body) => {
                if (!body.success) {
                    this.log.error(`Failed to change device status due to error ${body.msg}`);
                }
                else {
                    this.log.info(`${this.accessory.displayName} is now ${value == 0 ? 'Off' : 'On'}`);
                    this.switchStates.On = value;
                }
            });
        }
    }
    getOn() {
        return this.switchStates.On;
    }
    sendCommand(command, cb) {
        const commandObj = { 'raw_key': command };
        APIInvocationHelper_1.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.sendCommandAPIURL, "POST", commandObj, (body) => {
            cb(body);
        });
    }
}
exports.GenericAccessory = GenericAccessory;
//# sourceMappingURL=GenericAccessory.js.map