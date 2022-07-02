"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Device = void 0;
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
//# sourceMappingURL=Device.js.map