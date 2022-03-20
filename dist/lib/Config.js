"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Device = exports.Config = void 0;
class Config {
    constructor(client_id, secret, region, deviceId, autoFetchRemotes = true, devices) {
        this.client_id = "";
        this.secret = "";
        this.region = "";
        this.deviceId = "";
        this.autoFetchRemotes = true;
        this.devices = [];
        this.client_id = client_id || "";
        this.secret = secret || "";
        this.region = region || "";
        this.deviceId = deviceId || "";
        this.autoFetchRemotes = autoFetchRemotes;
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
        this.id = "";
        this.diy = false;
        this.model = "Unknown";
        this.brand = "Unknown";
        this.id = dev.id;
        this.diy = dev.diy;
        this.model = dev.model;
        this.brand = dev.brand;
    }
}
exports.Device = Device;
//# sourceMappingURL=Config.js.map