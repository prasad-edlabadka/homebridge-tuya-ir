"use strict";
const platform_1 = require("./platform");
const PLATFORM_NAME = 'TuyaIR';
module.exports = (api) => {
    api.registerPlatform(PLATFORM_NAME, platform_1.TuyaIRPlatform);
};
//# sourceMappingURL=index.js.map