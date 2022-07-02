"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuyaIRConfiguration = void 0;
const Device_1 = require("./Device");
class TuyaIRConfiguration {
    constructor(config, index) {
        var _a;
        this.tuyaAPIClientId = "";
        this.tuyaAPISecret = "";
        this.deviceRegion = "";
        this.irDeviceId = "";
        this.autoFetchRemotesFromServer = true;
        this.configuredRemotes = [];
        this.apiHost = "";
        Object.assign(this, config);
        this.irDeviceId = config.smartIR[index].deviceId;
        this.autoFetchRemotesFromServer = config.smartIR[index].autoFetchRemotesFromServer;
        this.configuredRemotes = (_a = config.smartIR[index].configuredRemotes) === null || _a === void 0 ? void 0 : _a.map(v => new Device_1.Device(v));
        this.apiHost = `https://openapi.tuya${this.deviceRegion}.com`;
    }
}
exports.TuyaIRConfiguration = TuyaIRConfiguration;
//# sourceMappingURL=TuyaIRConfiguration.js.map