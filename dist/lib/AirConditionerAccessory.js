"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirConditionerAccessory = void 0;
const Config_1 = require("./Config");
const TuyaAPIHelper_1 = require("./TuyaAPIHelper");
/**
 * Air Conditioner Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class AirConditionerAccessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        /**
         * These are just used to create a working example
         * You should implement your own code to track the state of your accessory
         */
        this.acStates = {
            On: false,
            temperature: 16,
            fan: 0
        };
        this.parentId = "";
        this.parentId = accessory.context.device.ir_id;
        this.tuya = TuyaAPIHelper_1.TuyaAPIHelper.Instance(new Config_1.Config(platform.config.client_id, platform.config.secret, platform.config.region, platform.config.deviceId, platform.config.devices), platform.log);
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.product_name)
            .setCharacteristic(this.platform.Characteristic.Model, 'Unknown')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.remote_id);
        // get the LightBulb service if it exists, otherwise create a new LightBulb service
        // you can create multiple services for each accessory
        this.service = this.accessory.getService(this.platform.Service.HeaterCooler) || this.accessory.addService(this.platform.Service.HeaterCooler);
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/Lightbulb
        // register handlers for the On/Off Characteristic
        this.service.getCharacteristic(this.platform.Characteristic.Active)
            .onSet(this.setOn.bind(this)) // SET - bind to the `setOn` method below
            .onGet(this.getOn.bind(this)); // GET - bind to the `getOn` method below
        this.service.getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
            .setProps({
            minValue: 16,
            maxValue: 28,
            minStep: 1,
        })
            .onGet(this.getCoolingThresholdTemperatureCharacteristic.bind(this))
            .onSet(this.setCoolingThresholdTemperatureCharacteristic.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .setProps({
            unit: undefined,
            minValue: 0,
            maxValue: 3,
            minStep: 1,
        })
            .onGet(this.getRotationSpeedCharacteristic.bind(this))
            .onSet(this.setRotationSpeedCharacteristic.bind(this));
    }
    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
     */
    async setOn(value) {
        // implement your own code to turn your device on/off
        var command = value ? 1 : 0;
        this.acStates.On = value;
        this.tuya.sendACCommand(this.parentId, this.accessory.context.device.remote_id, "power", command, () => {
            this.platform.log.info(`${this.accessory.displayName} is now ${command == 0 ? 'Off' : 'On'}`);
        });
    }
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
    async getOn() {
        // implement your own code to check if the device is on
        const isOn = this.acStates.On;
        // if you need to return an error to show the device as "Not Responding" in the Home app:
        // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        return isOn;
    }
    async getCoolingThresholdTemperatureCharacteristic() {
        //this.platform.log.info("" + this.acStates.temperature);
        const t = this.acStates.temperature;
        return t;
    }
    async setCoolingThresholdTemperatureCharacteristic(value) {
        //Change termperature
        var command = value;
        this.acStates.temperature = command;
        this.tuya.sendACCommand(this.parentId, this.accessory.context.device.remote_id, "temp", command, () => {
            this.platform.log.info(`${this.accessory.displayName} temperature is set to ${command} degrees.`);
        });
    }
    async getRotationSpeedCharacteristic() {
        return this.acStates.fan;
    }
    async setRotationSpeedCharacteristic(value) {
        //Change termperature
        var command = value;
        this.acStates.fan = command;
        this.tuya.sendACCommand(this.parentId, this.accessory.context.device.remote_id, "wind", command, () => {
            this.platform.log.info(`${this.accessory.displayName} Fan is set to ${command == 0 ? "auto" : command}.`);
        });
    }
}
exports.AirConditionerAccessory = AirConditionerAccessory;
//# sourceMappingURL=AirConditionerAccessory.js.map