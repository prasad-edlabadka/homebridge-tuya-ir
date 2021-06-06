"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Device = exports.Config = void 0;
class Config {
    constructor(client_id, secret, region, deviceId, devices) {
        this.client_id = "";
        this.secret = "";
        this.region = "";
        this.deviceId = "";
        this.devices = [];
        this.client_id = client_id || "";
        this.secret = secret || "";
        this.region = region || "";
        this.deviceId = deviceId || "";
        if (devices) {
            for (var i = 0; i < devices.length; i++) {
                this.devices.push(new Device(devices[i]));
            }
        }
    }
}
exports.Config = Config;
class Device {
    constructor(dev) {
        this.remoteId = "";
        this.remoteId = dev;
    }
}
exports.Device = Device;
//# sourceMappingURL=Config.js.map