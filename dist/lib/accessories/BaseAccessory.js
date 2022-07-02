"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAccessory = void 0;
class BaseAccessory {
    constructor(platform, accessory) {
        this.parentId = "";
        this.parentId = accessory.context.device.ir_id;
        this.configuration = accessory.context.device.config;
        this.log = platform.log;
    }
}
exports.BaseAccessory = BaseAccessory;
//# sourceMappingURL=BaseAccessory.js.map