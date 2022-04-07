"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoItYourselfAccessory = void 0;
const Config_1 = require("../Config");
const TuyaAPIHelper_1 = require("../TuyaAPIHelper");
/**
 * Do It Yourself Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class DoItYourselfAccessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        this.tuya = TuyaAPIHelper_1.TuyaAPIHelper.Instance(new Config_1.Config(platform.config.client_id, platform.config.secret, platform.config.region, platform.config.deviceId, platform.config.devices), platform.log);
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.product_name)
            .setCharacteristic(this.platform.Characteristic.Model, 'Infrared Controlled Switch')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);
        this.tuya.fetchLearningCodes(this.accessory.context.device.ir_id, this.accessory.context.device.id, (body) => {
            if (!body.success) {
                this.platform.log.error(`Failed to fetch learning codes due to error ${body.msg}`);
            }
            else {
                this.accessory.context.device.codes = body.result;
                // Cleaning accessories
                const uuids = this.accessory.context.device.codes.map(code => this.platform.api.hap.uuid.generate(code.key_name));
                for (let service_index = this.accessory.services.length - 1; service_index >= 0; service_index--) {
                    const service = this.accessory.services[service_index];
                    if (service.constructor.name === this.platform.api.hap.Service.Switch.name) {
                        if (!uuids.includes(service.subtype)) {
                            this.accessory.removeService(service);
                        }
                    }
                }
                for (const code of this.accessory.context.device.codes) {
                    this.platform.log.info(`Adding code ${code.key_name}`);
                    const service = this.accessory.getService(this.platform.api.hap.uuid.generate(code.key_name)) || accessory.addService(this.platform.api.hap.Service.Switch, code.key_name, this.platform.api.hap.uuid.generate(code.key_name), code.key);
                    service.getCharacteristic(this.platform.Characteristic.On)
                        .onGet(() => {
                        return false;
                    })
                        .onSet(((value) => {
                        if (value) {
                            this.tuya.sendLearningCode(this.accessory.context.device.ir_id, this.accessory.context.device.id, code.code, (body) => {
                                if (!body.success) {
                                    this.platform.log.error(`Failed to fetch learning codes due to error ${body.msg}`);
                                }
                                service.setCharacteristic(this.platform.Characteristic.On, false);
                            });
                        }
                    }));
                }
            }
        });
    }
}
exports.DoItYourselfAccessory = DoItYourselfAccessory;
//# sourceMappingURL=DoItYourselfAccessory.js.map