"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHelper = void 0;
class BaseHelper {
    constructor(config, log) {
        this.config = config;
        this.log = log;
        this.apiHost = `https://openapi.tuya${this.config.deviceRegion}.com`;
    }
}
exports.BaseHelper = BaseHelper;
//# sourceMappingURL=BaseHelper.js.map