"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuyaIRDiscovery = void 0;
const EventEmitter = require('events');
const Config_1 = require("./Config");
const TuyaAPIHelper_1 = require("./TuyaAPIHelper");
class TuyaIRDiscovery extends EventEmitter {
    constructor(log, api) {
        super();
        this.config = new Config_1.Config();
        this.log = log;
        this.api = api;
    }
    start(api, props, cb) {
        this.log.info(`Trying to login...`);
        this.config = new Config_1.Config(props.client_id, props.secret, props.region, props.deviceId, props.devices);
        var helper = TuyaAPIHelper_1.TuyaAPIHelper.Instance(this.config, this.log);
        helper.login(() => {
            this.log.info("Logged in. Fetching configured remotes...");
            helper.fetchDevices(this.config.deviceId, (devs) => {
                cb(devs);
            });
        });
    }
}
exports.TuyaIRDiscovery = TuyaIRDiscovery;
//# sourceMappingURL=TuyaIRDiscovery.js.map