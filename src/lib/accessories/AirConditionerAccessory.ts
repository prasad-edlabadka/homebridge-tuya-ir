import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { TuyaIRPlatform } from '../../platform';
import { Config } from '../Config';
import { TuyaAPIHelper } from '../TuyaAPIHelper';

/**
 * Air Conditioner Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class AirConditionerAccessory {
    private service: Service;

    /**
     * These are just used to create a working example
     * You should implement your own code to track the state of your accessory
     */
    private acStates = {
        On: false,
        temperature: 16,
        fan: 0,
        mode: 0
    };

    private parentId: string = "";
    private tuya: TuyaAPIHelper;

    constructor(
        private readonly platform: TuyaIRPlatform,
        private readonly accessory: PlatformAccessory,
    ) {

        this.parentId = accessory.context.device.ir_id;

        this.tuya = TuyaAPIHelper.Instance(new Config(platform.config.client_id, platform.config.secret, platform.config.region, platform.config.deviceId, platform.config.devices), platform.log);
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.brand)
            .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);

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
            .onSet(this.setOn.bind(this))      // SET - bind to the `setOn` method below
            .onGet(this.getOn.bind(this));     // GET - bind to the `getOn` method below

        this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
            .onSet(this.setHeatingCoolingState.bind(this))                // SET - bind to the `setHeatingCoolingState` method below
            .onGet(this.getHeatingCoolingState.bind(this));               // GET - bind to the `getHeatingCoolingState` method below

        this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .onGet(this.getCurrentTemperature.bind(this));               // GET - bind to the `getOn` method below

        this.service.getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
            .setProps({
                minValue: 16,
                maxValue: 30,
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
            
        this.refreshStatus();
    }
    
    
    /**
    * Load latest device status. 
    */
    async refreshStatus()
    {
        this.tuya.getACStatus(this.parentId, this.accessory.context.device.id,(body) => {
            if (!body.success) {
                this.platform.log.error(`Failed to get AC status due to error ${body.msg}`);
                throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE)
            } else {
                this.platform.log.info(`${this.accessory.displayName} status is ${JSON.stringify(body.result)}`);
                var isOn = body.result.power === "1" ? true : false;
                var mode = body.result.mode  as number;
                var temp = body.result.temp  as number;
                var fan  = body.result.wind  as number;
                this.service.updateCharacteristic(this.platform.Characteristic.Active, isOn);
                this.service.updateCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState, mode);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, temp);
                this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, fan);
                this.acStates.On          = isOn;
                this.acStates.mode 		  = mode;
                this.acStates.temperature = temp;
                this.acStates.fan		  = fan;
            }
        });
    }

    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
     */
    async setOn(value: CharacteristicValue) {
        // implement your own code to turn your device on/off
        var command = (value as boolean) ? 1 : 0;

        this.tuya.sendACCommand(this.parentId, this.accessory.context.device.id, "power", command, (body) => {
            if (!body.success) {
                this.platform.log.error(`Failed to change AC status due to error ${body.msg}`);
            } else {
                this.platform.log.info(`${this.accessory.displayName} is now ${command == 0 ? 'Off' : 'On'}`);
                this.acStates.On = value as boolean;
            }
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
    async getOn(): Promise<CharacteristicValue> 
    {
    	//Just need to refresh in this function, as the API returns everything.
        this.refreshStatus();
        
        const isOn = this.acStates.On;

        return isOn;
    }

    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
     */
    async setHeatingCoolingState(value: CharacteristicValue) {
        // implement your own code to turn your device on/off
        var val = value as number;
        var command;
        var modeName = "";
        if (val == this.platform.Characteristic.TargetHeatingCoolingState.COOL) {
            command = 0;
            modeName = "Cool";
        } else if (val == this.platform.Characteristic.TargetHeatingCoolingState.HEAT) {
            command = 1;
            modeName = "Heat";
        } else {
            command = 2;
            modeName = "Auto";
        }

        this.tuya.sendACCommand(this.parentId, this.accessory.context.device.id, "mode", command, (body) => {
            if (!body.success) {
                this.platform.log.error(`Failed to change AC mode due to error ${body.msg}`);
            } else {
                this.platform.log.info(`${this.accessory.displayName} mode is ${modeName}`);
                this.acStates.mode = val;
            }
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
    async getHeatingCoolingState(): Promise<CharacteristicValue> {
        // implement your own code to check if the device is on
        const isOn = this.acStates.mode;
        // if you need to return an error to show the device as "Not Responding" in the Home app:
        // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

        return isOn;
    }

    async getCoolingThresholdTemperatureCharacteristic(): Promise<CharacteristicValue> {
        //this.platform.log.info("" + this.acStates.temperature);
        const t = this.acStates.temperature;
        return t;
    }

    async setCoolingThresholdTemperatureCharacteristic(value: CharacteristicValue) {
        //Change termperature
        var command = value as number;

        this.tuya.sendACCommand(this.parentId, this.accessory.context.device.id, "temp", command, (body) => {
            if (!body.success) {
                this.platform.log.error(`Failed to change AC temperature due to error ${body.msg}`);
            } else {
                this.platform.log.info(`${this.accessory.displayName} temperature is set to ${command} degrees.`);
                this.acStates.temperature = command;
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, command);
            }
        });
    }

    async getRotationSpeedCharacteristic(): Promise<CharacteristicValue> {
        return this.acStates.fan;
    }

    async setRotationSpeedCharacteristic(value: CharacteristicValue) {
        //Change fan speed
        var command = value as number;

        this.tuya.sendACCommand(this.parentId, this.accessory.context.device.id, "wind", command, (body) => {
            if (!body.success) {
                this.platform.log.error(`Failed to change AC fan due to error ${body.msg}`);
            } else {
                this.platform.log.info(`${this.accessory.displayName} Fan is set to ${command == 0 ? "auto" : command}.`);
                this.acStates.fan = command;
            }
        });
    }

    async getCurrentTemperature(): Promise<CharacteristicValue> {
        return this.acStates.temperature;
    }
}
