"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoItYourselfAccessory = void 0;
const APIInvocationHelper_1 = require("../api/APIInvocationHelper");
const BaseAccessory_1 = require("./BaseAccessory");
/**
 * Do It Yourself Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class DoItYourselfAccessory extends BaseAccessory_1.BaseAccessory {
    constructor(platform, accessory) {
        var _a;
        super(platform, accessory);
        this.platform = platform;
        this.accessory = accessory;
        // set accessory information
        (_a = this.accessory.getService(this.platform.Service.AccessoryInformation)) === null || _a === void 0 ? void 0 : _a.setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.product_name).setCharacteristic(this.platform.Characteristic.Model, 'Infrared Controlled Switch').setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.id);
        this.fetchLearningCodes(this.accessory.context.device.ir_id, this.accessory.context.device.id, (body) => {
            if (!body.success) {
                this.log.error(`Failed to fetch learning codes due to error ${body.msg}`);
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
                    this.log.debug(`Adding code ${code.key_name}`);
                    const service = this.accessory.getService(this.platform.api.hap.uuid.generate(code.key_name)) || accessory.addService(this.platform.api.hap.Service.Switch, code.key_name, this.platform.api.hap.uuid.generate(code.key_name), code.key);
                    service.getCharacteristic(this.platform.Characteristic.On)
                        .onGet(() => {
                        return false;
                    })
                        .onSet(((value) => {
                        if (value) {
                            this.sendLearningCode(this.accessory.context.device.ir_id, this.accessory.context.device.id, code.code, (body) => {
                                if (!body.success) {
                                    this.log.error(`Failed to fetch learning codes due to error ${body.msg}`);
                                }
                                service.setCharacteristic(this.platform.Characteristic.On, false);
                            });
                        }
                    }));
                }
            }
        });
    }
    sendLearningCode(deviceId, remoteId, code, cb) {
        this.log.debug("Sending Learning Code");
        APIInvocationHelper_1.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + `/v2.0/infrareds/${deviceId}/remotes/${remoteId}/learning-codes`, "POST", { code }, (body) => {
            cb(body);
        });
    }
    fetchLearningCodes(deviceId, remoteId, cb) {
        this.log.debug("Getting Learning Codes");
        APIInvocationHelper_1.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + `/v2.0/infrareds/${deviceId}/remotes/${remoteId}/learning-codes`, "GET", {}, (body) => {
            this.log.debug(`Received learning codes ${JSON.stringify(body)}`);
            cb(body);
        });
    }
}
exports.DoItYourselfAccessory = DoItYourselfAccessory;
//# sourceMappingURL=DoItYourselfAccessory.js.map