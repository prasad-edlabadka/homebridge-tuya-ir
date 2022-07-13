import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { TuyaIRPlatform } from '../../platform';
import { BaseAccessory } from './BaseAccessory';
import { APIInvocationHelper } from '../api/APIInvocationHelper';

/**
 * Air Conditioner Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class AirConditionerAccessory extends BaseAccessory {
    private service: Service;
    private modeList = ['Cool', 'Heat', 'Auto'];

    private acStates = {
        On: false,
        temperature: 16,
        fan: 0,
        mode: 0
    };

    constructor(
        private readonly platform: TuyaIRPlatform,
        private readonly accessory: PlatformAccessory,
    ) {
        super(platform, accessory);

        this.accessory.getService(this.platform.Service.AccessoryInformation)
            ?.setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.brand || 'Unknown')
            .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model || 'Unknown')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);
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
            .setProps({
                minValue: 16,
                maxValue: 30,
                minStep: 1
            })
            .onGet(this.getCoolingThresholdTemperatureCharacteristic.bind(this))
            .onSet(this.setCoolingThresholdTemperatureCharacteristic.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
            .onGet(this.getCoolingThresholdTemperatureCharacteristic.bind(this))
            .onSet(this.setCoolingThresholdTemperatureCharacteristic.bind(this))
            .setProps({ unit: undefined, minValue: 17, maxValue: 30, minStep: 1, })

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
    }


    /**
    * Load latest device status. 
    */
    refreshStatus() {
        this.getACStatus(this.parentId, this.accessory.context.device.id, (body) => {
            if (!body.success) {
                this.log.error(`Failed to get AC status due to error ${body.msg}`);
            } else {
                this.log.debug(`${this.accessory.displayName} status is ${JSON.stringify(body.result)}`);
                this.acStates.On = body.result.power === "1" ? true : false;
                this.acStates.mode = body.result.mode as number;
                this.acStates.temperature = body.result.temp as number;
                this.acStates.fan = body.result.wind as number;
                this.service.updateCharacteristic(this.platform.Characteristic.Active, this.acStates.On);
                this.service.updateCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState, this.acStates.mode);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.acStates.temperature);
                this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.acStates.fan);
            }
            setTimeout(this.refreshStatus.bind(this), 30000);
        });
    }

    setOn(value: CharacteristicValue) {
        if (this.acStates.On == value as boolean) return;
        const command = (value as boolean) ? 1 : 0;
        this.sendACCommand(this.parentId, this.accessory.context.device.id, "power", command, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change AC status due to error ${body.msg}`);
            } else {
                this.log.info(`${this.accessory.displayName} is now ${command == 0 ? 'Off' : 'On'}`);
                this.acStates.On = value as boolean;
            }
        });
    }

    getOn(): CharacteristicValue {
        return this.acStates.On;
    }

    setHeatingCoolingState(value: CharacteristicValue) {
        const val = value as number;
        let command = 2;
        if (val == this.platform.Characteristic.TargetHeaterCoolerState.COOL) command = 0;
        if (val == this.platform.Characteristic.TargetHeaterCoolerState.HEAT) command = 1;

        this.sendACCommand(this.parentId, this.accessory.context.device.id, "mode", command, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change AC mode due to error ${body.msg}`);
            } else {
                this.log.info(`${this.accessory.displayName} mode is ${this.modeList[command]}`);
                this.acStates.mode = val;
            }
        });
    }

    getHeatingCoolingState(): CharacteristicValue {
        return this.acStates.mode;
    }

    getCoolingThresholdTemperatureCharacteristic(): CharacteristicValue {
        return this.acStates.temperature;
    }

    setCoolingThresholdTemperatureCharacteristic(value: CharacteristicValue) {
        const command = value as number;
        this.sendACCommand(this.parentId, this.accessory.context.device.id, "temp", command, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change AC temperature due to error ${body.msg}`);
            } else {
                this.log.info(`${this.accessory.displayName} temperature is set to ${command} degrees.`);
                this.acStates.temperature = command;
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, command);
            }
        });
    }

    getRotationSpeedCharacteristic(): CharacteristicValue {
        return this.acStates.fan;
    }

    setRotationSpeedCharacteristic(value: CharacteristicValue) {
        //Change fan speed
        const command = value as number;

        this.sendACCommand(this.parentId, this.accessory.context.device.id, "wind", command, (body) => {
            if (!body.success) {
                this.log.error(`Failed to change AC fan due to error ${body.msg}`);
            } else {
                this.log.info(`${this.accessory.displayName} Fan is set to ${command == 0 ? "auto" : command}.`);
                this.acStates.fan = command;
            }
        });
    }

    getCurrentTemperature(): CharacteristicValue {
        return this.acStates.temperature;
    }

    sendACCommand(deviceId: string, remoteId: string, command: string, value: string | number, cb) {
        const commandObj = {
            "code": command,
            "value": value
        }
        this.log.debug(JSON.stringify(commandObj));
        APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + `/v1.0/infrareds/${deviceId}/air-conditioners/${remoteId}/command`, "POST", commandObj, (body) => {
            cb(body);
        })
    }

    getACStatus(deviceId: string, remoteId: string, cb) {
        this.log.debug("Getting AC Status");
        APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + `/v2.0/infrareds/${deviceId}/remotes/${remoteId}/ac/status`, "GET", {}, (body) => {
            cb(body);
        })
    }
}
