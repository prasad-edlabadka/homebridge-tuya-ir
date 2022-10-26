"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightAccessory = void 0;
const BaseAccessory_1 = require("./BaseAccessory");
const APIInvocationHelper_1 = require("../api/APIInvocationHelper");
/**
 * Light Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class LightAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, accessory) {
        var _a, _b;
        super(platform, accessory);
        this.platform = platform;
        this.accessory = accessory;
        this.lightState = {
            On: false,
            brightness: 50
        };
        this.sendCommandAPIURL = `${this.configuration.apiHost}/v1.0/iot-03/devices/${accessory.context.device.id}/commands`;
        (_b = (_a = this.accessory) === null || _a === void 0 ? void 0 : _a.getService(this.platform.Service.AccessoryInformation)) === null || _b === void 0 ? void 0 : _b.setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.product_name).setCharacteristic(this.platform.Characteristic.Model, 'Infrared Controlled Light').setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);
        this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.Brightness)
            .onSet(this.setBrightness.bind(this))
            .onGet(this.getBrightness.bind(this));
    }
    setOn(value) {
        if (value !== this.lightState.On) {
            const command = value ? "PowerOn" : "PowerOff";
            this.sendLightCommand(command, (body) => {
                if (!body.success) {
                    this.log.error(`Failed to change ${this.accessory.displayName} status due to error ${body.msg}`);
                }
                else {
                    this.log.info(`${this.accessory.displayName} is now ${value == 0 ? 'Off' : 'On'}`);
                    this.lightState.On = value;
                }
            });
        }
    }
    getOn() {
        return this.lightState.On;
    }
    getBrightness() {
        return this.lightState.brightness;
    }
    setBrightness(value) {
        const command = value <= this.lightState.brightness ? "Brightness-" : "Brightness+";
        this.sendLightCommand(command, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change ${this.accessory.displayName} brightness due to error ${body.msg}`);
            }
            else {
                this.log.info(`${this.accessory.displayName} is brightness is now ${command === "Brightness+" ? 'increased' : 'decreased'}`);
                //this.lightState.brightness = 50;
                if (this.lightState.On) {
                    this.log.debug("Resetting slider to 50%");
                    this.service.updateCharacteristic(this.platform.Characteristic.Brightness, 50);
                }
            }
        });
    }
    sendLightCommand(command, cb) {
        const commandObj = { "commands": [{ "code": command, "value": 1 }] };
        APIInvocationHelper_1.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.sendCommandAPIURL, "POST", commandObj, (body) => {
            cb(body);
        });
    }
}
exports.LightAccessory = LightAccessory;
//# sourceMappingURL=LightAccessory.js.map