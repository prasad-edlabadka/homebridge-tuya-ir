"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuyaIRDiscovery = void 0;
const events_1 = __importDefault(require("events"));
const TuyaIRConfiguration_1 = require("./model/TuyaIRConfiguration");
const LoginHelper_1 = require("./api/LoginHelper");
const DeviceConfigurationHelper_1 = require("./api/DeviceConfigurationHelper");
class TuyaIRDiscovery extends events_1.default {
    constructor(log, platformConfig) {
        super();
        this.log = log;
        this.platformConfig = platformConfig;
    }
    startDiscovery(index, cb) {
        this.log.info(`Trying to login...`);
        const configuration = new TuyaIRConfiguration_1.TuyaIRConfiguration(this.platformConfig, index);
        const loginHelper = LoginHelper_1.LoginHelper.Instance(configuration, this.log);
        const deviceConfigHelper = DeviceConfigurationHelper_1.DeviceConfigurationHelper.Instance(configuration, this.log);
        loginHelper.login()
            .then(() => {
            this.log.info("Fetching configured remotes...");
            return deviceConfigHelper.fetchDevices(configuration.irDeviceId);
        }).then((devs) => {
            cb(devs, index);
        }).catch(error => {
            this.log.error("Failed because of " + error);
        });
    }
}
exports.TuyaIRDiscovery = TuyaIRDiscovery;
//# sourceMappingURL=TuyaIRDiscovery.js.map