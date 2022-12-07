"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirConditionerAccessory = void 0;
const BaseAccessory_1 = require("./BaseAccessory");
const APIInvocationHelper_1 = require("../api/APIInvocationHelper");
/**
 * Air Conditioner Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class AirConditionerAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, accessory, characteristic) {
        var _a;
        super(platform, accessory);
        this.platform = platform;
        this.accessory = accessory;
        this.characteristic = characteristic;
        this.modeList = ['Cool', 'Heat', 'Auto'];
        this.modeCode = [];
        this.acStates = {
            On: false,
            temperature: 16,
            fan: 0,
            mode: 0
        };
        this.modeCode = [];
        this.modeCode.push(this.platform.Characteristic.TargetHeaterCoolerState.COOL);
        this.modeCode.push(this.platform.Characteristic.TargetHeaterCoolerState.HEAT);
        this.modeCode.push(this.platform.Characteristic.TargetHeaterCoolerState.AUTO);
        (_a = this.accessory.getService(this.platform.Service.AccessoryInformation)) === null || _a === void 0 ? void 0 : _a.setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.brand || 'Unknown').setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model || 'Unknown').setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);
        this.service = this.accessory.getService(this.platform.Service.HeaterCooler) || this.accessory.addService(this.platform.Service.HeaterCooler);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
        this.service.getCharacteristic(this.platform.Characteristic.Active)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
            .onSet(this.setHeatingCoolingState.bind(this))
            .onGet(this.getHeatingCoolingState.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .onGet(this.getCurrentTemperature.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
            .onGet(this.getCoolingThresholdTemperatureCharacteristic.bind(this))
            .onSet(this.setCoolingThresholdTemperatureCharacteristic.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
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
        this.refreshStatus();
        this.getTemperatureRange();
    }
    getTemperatureRange() {
        APIInvocationHelper_1.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, `${this.configuration.apiHost}/v1.0/iot-03/devices/${this.accessory.context.device.id}/specification`, "GET", {}, (body) => {
            let temperatureConfig = {
                min: 16,
                max: 26,
                step: 1
            };
            if (body.success) {
                try {
                    temperatureConfig = JSON.parse(body.result.functions.filter(v => v.code === "T")[0].values);
                }
                catch (e) {
                    this.log.error(`Failed to parse AC temperature range due to error ${e}. Using defaults.`);
                }
            }
            else {
                this.log.error(`Failed to get AC temperature range. Using defaults. ${body.msg}`);
            }
            this.service.getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
                .setProps({
                minValue: temperatureConfig.min,
                maxValue: temperatureConfig.max,
                minStep: temperatureConfig.step
            });
            this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
                .setProps({
                minValue: temperatureConfig.min,
                maxValue: temperatureConfig.max,
                minStep: temperatureConfig.step
            });
            this.log.debug("Minimum Temperature: " + temperatureConfig.min);
            this.log.debug("Maximum Temperature: " + temperatureConfig.max);
        });
    }
    /**
    * Load latest device status.
    */
    refreshStatus() {
        this.getACStatus(this.parentId, this.accessory.context.device.id, (body) => {
            if (!body.success) {
                this.log.error(`Failed to get AC status due to error ${body.msg}`);
            }
            else {
                this.log.debug(`${this.accessory.displayName} status is ${JSON.stringify(body.result)}`);
                this.acStates.On = body.result.power === "1" ? true : false;
                this.acStates.mode = this.modeCode[body.result.mode] || this.platform.Characteristic.TargetHeaterCoolerState.AUTO;
                this.acStates.temperature = body.result.temp;
                this.acStates.fan = body.result.wind;
                this.service.updateCharacteristic(this.platform.Characteristic.Active, this.acStates.On);
                this.service.updateCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState, this.acStates.mode);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, 24); //this.acStates.temperature
                this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.acStates.fan);
                this.log.info(`N4D ${this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)}`);
            }
            setTimeout(this.refreshStatus.bind(this), 30000);
        });
    }
    setOn(value) {
        if (this.acStates.On == value)
            return;
        const command = value ? 1 : 0;
        this.sendACCommand(this.parentId, this.accessory.context.device.id, "power", command, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change status of ${this.accessory.displayName} due to error ${body.msg}`);
            }
            else {
                this.log.info(`${this.accessory.displayName} is now ${command == 0 ? 'Off' : 'On'}`);
                this.acStates.On = value;
            }
        });
    }
    getOn() {
        return this.acStates.On;
    }
    setHeatingCoolingState(value) {
        const val = value;
        let command = 2;
        if (val == this.platform.Characteristic.TargetHeaterCoolerState.COOL)
            command = 0;
        if (val == this.platform.Characteristic.TargetHeaterCoolerState.HEAT)
            command = 1;
        this.sendACCommand(this.parentId, this.accessory.context.device.id, "mode", command, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change ${this.accessory.displayName} mode due to error ${body.msg}`);
            }
            else {
                this.log.info(`${this.accessory.displayName} mode is ${this.modeList[command]}`);
                this.acStates.mode = val;
            }
        });
    }
    getHeatingCoolingState() {
        return this.acStates.mode;
    }
    getCoolingThresholdTemperatureCharacteristic() {
        return this.acStates.temperature;
    }
    setCoolingThresholdTemperatureCharacteristic(value) {
        const command = value;
        this.sendACCommand(this.parentId, this.accessory.context.device.id, "temp", command, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change ${this.accessory.displayName} temperature due to error ${body.msg}`);
            }
            else {
                this.log.info(`${this.accessory.displayName} temperature is set to ${command} degrees.`);
                this.acStates.temperature = command;
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, command);
            }
        });
    }
    getRotationSpeedCharacteristic() {
        return this.acStates.fan;
    }
    setRotationSpeedCharacteristic(value) {
        //Change fan speed
        const command = value;
        this.sendACCommand(this.parentId, this.accessory.context.device.id, "wind", command, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change ${this.accessory.displayName} fan due to error ${body.msg}`);
            }
            else {
                this.log.info(`${this.accessory.displayName} Fan is set to ${command == 0 ? "auto" : command}.`);
                this.acStates.fan = command;
            }
        });
    }
    getCurrentTemperature() {
        let temp = this.acStates.temperature;
        return temp;
    }
    sendACCommand(deviceId, remoteId, command, value, cb) {
        const commandObj = {
            "code": command,
            "value": value
        };
        this.log.debug(JSON.stringify(commandObj));
        APIInvocationHelper_1.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + `/v2.0/infrareds/${deviceId}/air-conditioners/${remoteId}/command`, "POST", commandObj, (body) => {
            cb(body);
        });
    }
    getACStatus(deviceId, remoteId, cb) {
        this.log.debug("Getting AC Status");
        APIInvocationHelper_1.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + `/v2.0/infrareds/${deviceId}/remotes/${remoteId}/ac/status`, "GET", {}, (body) => {
            cb(body);
        });
    }
}
exports.AirConditionerAccessory = AirConditionerAccessory;
//# sourceMappingURL=AirConditionerAccessory.js.map