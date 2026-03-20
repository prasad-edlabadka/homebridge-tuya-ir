"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuyaIRConfiguration = void 0;
const Device_1 = require("./Device");
class TuyaIRConfiguration {
    constructor(config, index) {
        var _a, _b;
        this.tuyaAPIClientId = "";
        this.tuyaAPISecret = "";
        this.deviceRegion = "";
        this.irDeviceId = "";
        this.autoFetchRemotesFromServer = true;
        this.configuredRemotes = [];
        this.apiHost = "";
        this.tuyaAPIClientId = config.tuyaAPIClientId;
        this.tuyaAPISecret = config.tuyaAPISecret;
        this.deviceRegion = config.deviceRegion;
        this.irDeviceId = config.smartIR[index].deviceId;
        this.autoFetchRemotesFromServer = config.smartIR[index].autoFetchRemotesFromServer;
        this.configuredRemotes = (_b = (_a = config.smartIR[index].configuredRemotes) === null || _a === void 0 ? void 0 : _a.map(v => new Device_1.Device(v))) !== null && _b !== void 0 ? _b : [];
        this.apiHost = `https://openapi.tuya${this.deviceRegion}.com`;
    }
}
exports.TuyaIRConfiguration = TuyaIRConfiguration;
//# sourceMappingURL=TuyaIRConfiguration.js.map