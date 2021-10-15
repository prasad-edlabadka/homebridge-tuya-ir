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
    start(api, props, index, cb) {
        this.log.info(`Trying to login...`);
        this.config = new Config_1.Config(props.client_id, props.secret, props.region, props.smartIR[index].deviceId, props.smartIR[index].autoFetchRemotes, props.smartIR[index].devices);
        var helper = TuyaAPIHelper_1.TuyaAPIHelper.Instance(this.config, this.log);
        helper.login(() => {
            this.log.info("Fetching configured remotes...");
            helper.fetchDevices(this.config.deviceId, (devs) => {
                cb(devs, index);
            });
        });
    }
}
exports.TuyaIRDiscovery = TuyaIRDiscovery;
//# sourceMappingURL=TuyaIRDiscovery.js.map