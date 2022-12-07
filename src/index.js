var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
System.register("lib/model/Device", [], function (exports_1, context_1) {
    "use strict";
    var Device;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            Device = /** @class */ (function () {
                function Device(dev) {
                    this.id = "";
                    this.diy = false;
                    this.model = "Unknown";
                    this.brand = "Unknown";
                    this.id = dev.id;
                    this.diy = dev.diy;
                    this.model = dev.model;
                    this.brand = dev.brand;
                }
                return Device;
            }());
            exports_1("Device", Device);
        }
    };
});
System.register("lib/model/TuyaIRConfiguration", ["lib/model/Device"], function (exports_2, context_2) {
    "use strict";
    var Device_1, TuyaIRConfiguration;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [
            function (Device_1_1) {
                Device_1 = Device_1_1;
            }
        ],
        execute: function () {
            TuyaIRConfiguration = /** @class */ (function () {
                function TuyaIRConfiguration(config, index) {
                    var _a;
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
                    this.configuredRemotes = (_a = config.smartIR[index].configuredRemotes) === null || _a === void 0 ? void 0 : _a.map(function (v) { return new Device_1.Device(v); });
                    this.apiHost = "https://openapi.tuya".concat(this.deviceRegion, ".com");
                }
                return TuyaIRConfiguration;
            }());
            exports_2("TuyaIRConfiguration", TuyaIRConfiguration);
        }
    };
});
System.register("lib/api/APIInvocationHelper", ["crypto-js", "https", "url", "lib/api/LoginHelper"], function (exports_3, context_3) {
    "use strict";
    var crypto_js_1, https_1, url_1, LoginHelper_1, APIInvocationHelper;
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [
            function (crypto_js_1_1) {
                crypto_js_1 = crypto_js_1_1;
            },
            function (https_1_1) {
                https_1 = https_1_1;
            },
            function (url_1_1) {
                url_1 = url_1_1;
            },
            function (LoginHelper_1_1) {
                LoginHelper_1 = LoginHelper_1_1;
            }
        ],
        execute: function () {
            APIInvocationHelper = /** @class */ (function () {
                function APIInvocationHelper() {
                }
                APIInvocationHelper.getSignedValuesForGetWithAccessToken = function (url, config, timestamp, accessToken) {
                    return this.calculateSign(url, config, "GET", timestamp, true, accessToken);
                };
                APIInvocationHelper.getSignedValuesForGetWithoutAccessToken = function (url, config, timestamp) {
                    return this.calculateSign(url, config, "GET", timestamp, false);
                };
                APIInvocationHelper.invokeTuyaIrApi = function (log, config, endpoint, method, body, callback) {
                    log.debug("Calling endpoint ".concat(endpoint, " with payload ").concat(JSON.stringify(body)));
                    var timestamp = new Date().getTime();
                    var accessToken = LoginHelper_1.LoginHelper.Instance(config, log).getAccessToken();
                    var emptyBodyForGet = method === "GET" ? "" : JSON.stringify(body);
                    var signedParameters = this.calculateSign(new url_1.URL(endpoint), config, method, timestamp, true, accessToken, emptyBodyForGet);
                    var options = {
                        url: endpoint,
                        method: method,
                        headers: {
                            'client_id': config.tuyaAPIClientId,
                            'sign': signedParameters.signKey,
                            't': timestamp,
                            'access_token': accessToken,
                            'sign_method': 'HMAC-SHA256',
                            'Content-Type': 'application/json'
                        }
                    };
                    var req = https_1["default"].request(endpoint, options, function (incomingMsg) {
                        var body = '';
                        incomingMsg.on('data', function (chunk) {
                            body += chunk;
                        });
                        incomingMsg.on('end', function () {
                            if (incomingMsg.statusCode != 200) {
                                log.error("Api call failed with response code " + incomingMsg.statusCode);
                            }
                            else {
                                var jsonBody = void 0;
                                try {
                                    jsonBody = JSON.parse(body);
                                }
                                catch (error) {
                                    jsonBody = { msg: "Unable to parse body because '".concat(error, "'") };
                                }
                                log.debug("API call successful.", body);
                                callback(jsonBody);
                            }
                        });
                    }).on('error', function (err) {
                        log.error(err.message, err.stack);
                        callback({ msg: "Failed to invoke API '".concat(err.message, "'") });
                    });
                    req.write(JSON.stringify(body));
                    req.end();
                };
                APIInvocationHelper.calculateSign = function (url, config, httpMethod, timestamp, withAccessToken, accessToken, body) {
                    if (accessToken === void 0) { accessToken = ""; }
                    if (body === void 0) { body = ""; }
                    var returnObject = { timestamp: timestamp, signKey: "" };
                    var signedParameters = this.stringToSign(url.search, url.pathname, httpMethod, body);
                    var signStr = signedParameters.signedUrl;
                    var str = withAccessToken ? config.tuyaAPIClientId + accessToken + timestamp + signStr : config.tuyaAPIClientId + timestamp + signStr;
                    returnObject.signKey = crypto_js_1["default"].HmacSHA256(str, config.tuyaAPISecret).toString().toUpperCase();
                    return returnObject;
                };
                APIInvocationHelper.stringToSign = function (query, url, method, body) {
                    if (body === void 0) { body = ""; }
                    var sha256 = crypto_js_1["default"].SHA256(body);
                    return { signedUrl: method + "\n" + sha256 + "\n\n" + url + query, url: url + query };
                };
                return APIInvocationHelper;
            }());
            exports_3("APIInvocationHelper", APIInvocationHelper);
        }
    };
});
System.register("lib/api/BaseHelper", [], function (exports_4, context_4) {
    "use strict";
    var BaseHelper;
    var __moduleName = context_4 && context_4.id;
    return {
        setters: [],
        execute: function () {
            BaseHelper = /** @class */ (function () {
                function BaseHelper(config, log) {
                    this.config = config;
                    this.log = log;
                    this.apiHost = "https://openapi.tuya".concat(this.config.deviceRegion, ".com");
                }
                return BaseHelper;
            }());
            exports_4("BaseHelper", BaseHelper);
        }
    };
});
System.register("lib/api/LoginHelper", ["https", "url", "lib/api/APIInvocationHelper", "lib/api/BaseHelper"], function (exports_5, context_5) {
    "use strict";
    var https_2, url_2, APIInvocationHelper_1, BaseHelper_1, LoginHelper;
    var __moduleName = context_5 && context_5.id;
    return {
        setters: [
            function (https_2_1) {
                https_2 = https_2_1;
            },
            function (url_2_1) {
                url_2 = url_2_1;
            },
            function (APIInvocationHelper_1_1) {
                APIInvocationHelper_1 = APIInvocationHelper_1_1;
            },
            function (BaseHelper_1_1) {
                BaseHelper_1 = BaseHelper_1_1;
            }
        ],
        execute: function () {
            LoginHelper = /** @class */ (function (_super) {
                __extends(LoginHelper, _super);
                function LoginHelper(config, log) {
                    var _this = _super.call(this, config, log) || this;
                    _this.accessToken = "";
                    _this.refreshToken = "";
                    return _this;
                }
                LoginHelper.Instance = function (config, log) {
                    return this._instance || (this._instance = new this(config, log));
                };
                LoginHelper.prototype.getAccessToken = function () {
                    return this.accessToken;
                };
                LoginHelper.prototype.login = function () {
                    var _this = this;
                    return new Promise(function (resolve, reject) {
                        var LOGIN_URI = "/v1.0/token?grant_type=1";
                        _this.log.debug("Logging in to the the server ".concat(_this.apiHost, "..."));
                        _this.invokeTuyaLoginAPI(_this.apiHost + LOGIN_URI, function (body) {
                            if (body.success) {
                                _this.extractAccessTokenFromAPIResponse(body);
                                _this.configureNextAccessTokenRefresh(body.result.expire_time);
                                _this.log.info("Login successful.");
                                resolve('');
                            }
                            else {
                                _this.handleLoginError(body.msg);
                                reject(body.msg);
                            }
                        });
                    });
                };
                LoginHelper.prototype.invokeTuyaLoginAPI = function (endpoint, callback) {
                    var _this = this;
                    var timestamp = new Date().getTime();
                    var signedParameters = APIInvocationHelper_1.APIInvocationHelper.getSignedValuesForGetWithoutAccessToken(new url_2.URL(endpoint), this.config, timestamp);
                    var options = {
                        url: endpoint,
                        headers: {
                            'client_id': this.config.tuyaAPIClientId,
                            'sign': signedParameters.signKey,
                            't': timestamp,
                            'sign_method': 'HMAC-SHA256',
                            'nonce': ''
                        }
                    };
                    this.log.debug(JSON.stringify(options));
                    https_2["default"].get(endpoint, options, function (incomingMsg) {
                        var body = '';
                        incomingMsg.on('data', function (chunk) {
                            body += chunk;
                        });
                        incomingMsg.on('end', function () {
                            _this.log.debug(body);
                            if (incomingMsg.statusCode != 200) {
                                _this.log.error("Api call failed with response code " + incomingMsg.statusCode);
                            }
                            else {
                                var jsonBody = void 0;
                                try {
                                    jsonBody = JSON.parse(body);
                                }
                                catch (error) {
                                    jsonBody = { msg: "Unable to parse body because '".concat(error, "'") };
                                }
                                _this.log.debug("API call successful.");
                                callback(jsonBody);
                            }
                        });
                    }).on('error', function (err) {
                        _this.log.error("API call failed.");
                        _this.log.error(err.message, err.stack);
                    });
                };
                LoginHelper.prototype.refreshAccessToken = function () {
                    var _this = this;
                    this.log.info("Need to refresh token now...");
                    this.invokeTuyaLoginAPI(this.apiHost + "/v1.0/token/" + this.refreshToken, function (body) {
                        if (body.success) {
                            _this.extractAccessTokenFromAPIResponse(body);
                            _this.configureNextAccessTokenRefresh(body.result.expire_time);
                            _this.log.info("Token refreshed successfully. Next refresh after ".concat(body.result.expire_time, " seconds"));
                        }
                        else {
                            _this.log.error("Unable to refresh token: ".concat(body.msg, ". Trying fresh login..."));
                            _this.login();
                        }
                    });
                };
                LoginHelper.prototype.configureNextAccessTokenRefresh = function (refreshInterval) {
                    var _this = this;
                    setTimeout(function () {
                        _this.refreshAccessToken();
                    }, (refreshInterval - 5) * 1000);
                };
                LoginHelper.prototype.extractAccessTokenFromAPIResponse = function (responseBody) {
                    this.accessToken = responseBody.result.access_token;
                    this.refreshToken = responseBody.result.refresh_token;
                };
                LoginHelper.prototype.handleLoginError = function (errorMessage) {
                    var _this = this;
                    this.log.error("Failed to login due to error '".concat(errorMessage, "'. Retying after 1 minute..."));
                    setTimeout(function () {
                        _this.login();
                    }, 60000);
                };
                return LoginHelper;
            }(BaseHelper_1.BaseHelper));
            exports_5("LoginHelper", LoginHelper);
        }
    };
});
System.register("lib/api/DeviceConfigurationHelper", ["lib/api/APIInvocationHelper", "lib/api/BaseHelper"], function (exports_6, context_6) {
    "use strict";
    var APIInvocationHelper_2, BaseHelper_2, DeviceConfigurationHelper;
    var __moduleName = context_6 && context_6.id;
    return {
        setters: [
            function (APIInvocationHelper_2_1) {
                APIInvocationHelper_2 = APIInvocationHelper_2_1;
            },
            function (BaseHelper_2_1) {
                BaseHelper_2 = BaseHelper_2_1;
            }
        ],
        execute: function () {
            DeviceConfigurationHelper = /** @class */ (function (_super) {
                __extends(DeviceConfigurationHelper, _super);
                function DeviceConfigurationHelper(config, log) {
                    return _super.call(this, config, log) || this;
                }
                DeviceConfigurationHelper.Instance = function (config, log) {
                    if (this._instance) {
                        this._instance.config = config;
                        this._instance.log = log;
                    }
                    else {
                        this._instance = new this(config, log);
                    }
                    return this._instance;
                };
                DeviceConfigurationHelper.prototype.fetchDevices = function (deviceId) {
                    var _this = this;
                    return new Promise(function (resolve) {
                        _this.log.debug("This is the config: ".concat(JSON.stringify(_this.config)));
                        if (!_this.config.autoFetchRemotesFromServer) {
                            _this.log.info("Auto discovery of remotes disabled...");
                            _this.manualFetch(resolve);
                        }
                        else {
                            _this.log.info("Auto discovery of remotes enabled. Fetching with API...");
                            _this.autoFetch(deviceId, resolve);
                        }
                    });
                };
                DeviceConfigurationHelper.prototype.manualFetch = function (cb) {
                    var _this = this;
                    var devs = [];
                    var _loop_1 = function (i) {
                        var dev = this_1.config.configuredRemotes[i];
                        this_1.fetchRemoteDetails(this_1.config.irDeviceId, dev.id, function (device) {
                            device.config = _this.config;
                            device.diy = dev.diy;
                            devs.push(device);
                            if (devs.length == _this.config.configuredRemotes.length) {
                                cb(devs);
                            }
                        });
                    };
                    var this_1 = this;
                    for (var i = 0; i < this.config.configuredRemotes.length; i++) {
                        _loop_1(i);
                    }
                };
                DeviceConfigurationHelper.prototype.autoFetch = function (deviceId, cb) {
                    var _this = this;
                    APIInvocationHelper_2.APIInvocationHelper.invokeTuyaIrApi(this.log, this.config, "".concat(this.apiHost, "/v2.0/infrareds/").concat(deviceId, "/remotes"), "GET", {}, function (body) {
                        var devs = [];
                        if (body.success && body.result) {
                            _this.log.debug("API returned ".concat(body.result.length, " remotes..."));
                            for (var i = 0; i < body.result.length; i++) {
                                _this.fetchRemoteDetails(deviceId, body.result[i].remote_id, function (device) {
                                    device.config = _this.config;
                                    devs.push(device);
                                    if (devs.length == body.result.length) {
                                        cb(devs);
                                    }
                                });
                            }
                        }
                        else {
                            _this.log.warn("API didn't return any devices Using hardcoded devices...");
                            _this.manualFetch(cb);
                        }
                    });
                };
                DeviceConfigurationHelper.prototype.fetchRemoteDetails = function (irId, id, callback) {
                    var _this = this;
                    this.log.debug(this.apiHost + "/v1.0/devices/".concat(id));
                    APIInvocationHelper_2.APIInvocationHelper.invokeTuyaIrApi(this.log, this.config, this.apiHost + "/v1.0/devices/".concat(id), "GET", {}, function (body) {
                        if (body.success) {
                            callback(body.result);
                        }
                        else {
                            _this.log.error("Failed to get remote configuration for: " + id);
                            _this.log.error("Server returned error: '".concat(body.msg, "'"));
                            callback({});
                        }
                    });
                };
                return DeviceConfigurationHelper;
            }(BaseHelper_2.BaseHelper));
            exports_6("DeviceConfigurationHelper", DeviceConfigurationHelper);
        }
    };
});
System.register("lib/TuyaIRDiscovery", ["events", "lib/model/TuyaIRConfiguration", "lib/api/LoginHelper", "lib/api/DeviceConfigurationHelper"], function (exports_7, context_7) {
    "use strict";
    var events_1, TuyaIRConfiguration_1, LoginHelper_2, DeviceConfigurationHelper_1, TuyaIRDiscovery;
    var __moduleName = context_7 && context_7.id;
    return {
        setters: [
            function (events_1_1) {
                events_1 = events_1_1;
            },
            function (TuyaIRConfiguration_1_1) {
                TuyaIRConfiguration_1 = TuyaIRConfiguration_1_1;
            },
            function (LoginHelper_2_1) {
                LoginHelper_2 = LoginHelper_2_1;
            },
            function (DeviceConfigurationHelper_1_1) {
                DeviceConfigurationHelper_1 = DeviceConfigurationHelper_1_1;
            }
        ],
        execute: function () {
            TuyaIRDiscovery = /** @class */ (function (_super) {
                __extends(TuyaIRDiscovery, _super);
                function TuyaIRDiscovery(log, platformConfig) {
                    var _this = _super.call(this) || this;
                    _this.log = log;
                    _this.platformConfig = platformConfig;
                    return _this;
                }
                TuyaIRDiscovery.prototype.startDiscovery = function (index, cb) {
                    var _this = this;
                    this.log.info("Trying to login for index ".concat(index, "..."));
                    var configuration = new TuyaIRConfiguration_1.TuyaIRConfiguration(this.platformConfig, index);
                    var loginHelper = LoginHelper_2.LoginHelper.Instance(configuration, this.log);
                    var deviceConfigHelper = DeviceConfigurationHelper_1.DeviceConfigurationHelper.Instance(configuration, this.log);
                    loginHelper.login()
                        .then(function () {
                        _this.log.info("Fetching configured remotes...");
                        return deviceConfigHelper.fetchDevices(configuration.irDeviceId);
                    }).then(function (devs) {
                        cb(devs, index);
                    })["catch"](function (error) {
                        _this.log.error("Failed because of " + error);
                    });
                };
                return TuyaIRDiscovery;
            }(events_1["default"]));
            exports_7("TuyaIRDiscovery", TuyaIRDiscovery);
        }
    };
});
System.register("lib/accessories/BaseAccessory", [], function (exports_8, context_8) {
    "use strict";
    var BaseAccessory;
    var __moduleName = context_8 && context_8.id;
    return {
        setters: [],
        execute: function () {
            BaseAccessory = /** @class */ (function () {
                function BaseAccessory(platform, accessory) {
                    this.parentId = "";
                    this.parentId = accessory.context.device.ir_id;
                    this.configuration = accessory.context.device.config;
                    this.log = platform.log;
                }
                return BaseAccessory;
            }());
            exports_8("BaseAccessory", BaseAccessory);
        }
    };
});
System.register("lib/accessories/AirConditionerAccessory", ["lib/accessories/BaseAccessory", "lib/api/APIInvocationHelper"], function (exports_9, context_9) {
    "use strict";
    var BaseAccessory_1, APIInvocationHelper_3, AirConditionerAccessory;
    var __moduleName = context_9 && context_9.id;
    return {
        setters: [
            function (BaseAccessory_1_1) {
                BaseAccessory_1 = BaseAccessory_1_1;
            },
            function (APIInvocationHelper_3_1) {
                APIInvocationHelper_3 = APIInvocationHelper_3_1;
            }
        ],
        execute: function () {
            /**
             * Air Conditioner Accessory
             * An instance of this class is created for each accessory your platform registers
             * Each accessory may expose multiple services of different service types.
             */
            AirConditionerAccessory = /** @class */ (function (_super) {
                __extends(AirConditionerAccessory, _super);
                function AirConditionerAccessory(platform, accessory) {
                    var _this = this;
                    var _a;
                    _this = _super.call(this, platform, accessory) || this;
                    _this.platform = platform;
                    _this.accessory = accessory;
                    _this.modeList = ['Cool', 'Heat', 'Auto'];
                    _this.modeCode = [];
                    _this.acStates = {
                        On: false,
                        temperature: 16,
                        fan: 0,
                        mode: 0
                    };
                    _this.modeCode = [];
                    _this.modeCode.push(_this.platform.Characteristic.TargetHeaterCoolerState.COOL);
                    _this.modeCode.push(_this.platform.Characteristic.TargetHeaterCoolerState.HEAT);
                    _this.modeCode.push(_this.platform.Characteristic.TargetHeaterCoolerState.AUTO);
                    (_a = _this.accessory.getService(_this.platform.Service.AccessoryInformation)) === null || _a === void 0 ? void 0 : _a.setCharacteristic(_this.platform.Characteristic.Manufacturer, accessory.context.device.brand || 'Unknown').setCharacteristic(_this.platform.Characteristic.Model, accessory.context.device.model || 'Unknown').setCharacteristic(_this.platform.Characteristic.SerialNumber, accessory.context.device.id);
                    _this.service = _this.accessory.getService(_this.platform.Service.HeaterCooler) || _this.accessory.addService(_this.platform.Service.HeaterCooler);
                    _this.service.setCharacteristic(_this.platform.Characteristic.Name, accessory.context.device.name);
                    _this.service.getCharacteristic(_this.platform.Characteristic.Active)
                        .onSet(_this.setOn.bind(_this))
                        .onGet(_this.getOn.bind(_this));
                    _this.service.getCharacteristic(_this.platform.Characteristic.TargetHeaterCoolerState)
                        .onSet(_this.setHeatingCoolingState.bind(_this))
                        .onGet(_this.getHeatingCoolingState.bind(_this));
                    _this.service.getCharacteristic(_this.platform.Characteristic.CurrentTemperature)
                        .onGet(_this.getCurrentTemperature.bind(_this));
                    _this.service.getCharacteristic(_this.platform.Characteristic.CoolingThresholdTemperature)
                        .onGet(_this.getCoolingThresholdTemperatureCharacteristic.bind(_this))
                        .onSet(_this.setCoolingThresholdTemperatureCharacteristic.bind(_this));
                    _this.service.getCharacteristic(_this.platform.Characteristic.HeatingThresholdTemperature)
                        .onGet(_this.getCoolingThresholdTemperatureCharacteristic.bind(_this))
                        .onSet(_this.setCoolingThresholdTemperatureCharacteristic.bind(_this));
                    _this.service.getCharacteristic(_this.platform.Characteristic.RotationSpeed)
                        .setProps({
                        unit: undefined,
                        minValue: 0,
                        maxValue: 3,
                        minStep: 1
                    })
                        .onGet(_this.getRotationSpeedCharacteristic.bind(_this))
                        .onSet(_this.setRotationSpeedCharacteristic.bind(_this));
                    _this.refreshStatus();
                    _this.getTemperatureRange();
                    return _this;
                }
                AirConditionerAccessory.prototype.getTemperatureRange = function () {
                    var _this = this;
                    APIInvocationHelper_3.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, "".concat(this.configuration.apiHost, "/v1.0/iot-03/devices/").concat(this.accessory.context.device.id, "/specification"), "GET", {}, function (body) {
                        var temperatureConfig = {
                            min: 16,
                            max: 26,
                            step: 1
                        };
                        if (body.success) {
                            try {
                                temperatureConfig = JSON.parse(body.result.functions.filter(function (v) { return v.code === "T"; })[0].values);
                            }
                            catch (e) {
                                _this.log.error("Failed to parse AC temperature range due to error ".concat(e, ". Using defaults."));
                            }
                        }
                        else {
                            _this.log.error("Failed to get AC temperature range. Using defaults. ".concat(body.msg));
                        }
                        _this.service.getCharacteristic(_this.platform.Characteristic.CoolingThresholdTemperature)
                            .setProps({
                            minValue: temperatureConfig.min,
                            maxValue: temperatureConfig.max,
                            minStep: temperatureConfig.step
                        });
                        _this.service.getCharacteristic(_this.platform.Characteristic.HeatingThresholdTemperature)
                            .setProps({
                            minValue: temperatureConfig.min,
                            maxValue: temperatureConfig.max,
                            minStep: temperatureConfig.step
                        });
                        _this.log.debug("Minimum Temperature: " + temperatureConfig.min);
                        _this.log.debug("Maximum Temperature: " + temperatureConfig.max);
                    });
                };
                /**
                * Load latest device status.
                */
                AirConditionerAccessory.prototype.refreshStatus = function () {
                    var _this = this;
                    this.getACStatus(this.parentId, this.accessory.context.device.id, function (body) {
                        if (!body.success) {
                            _this.log.error("Failed to get AC status due to error ".concat(body.msg));
                        }
                        else {
                            _this.log.debug("".concat(_this.accessory.displayName, " status is ").concat(JSON.stringify(body.result)));
                            _this.acStates.On = body.result.power === "1" ? true : false;
                            _this.acStates.mode = _this.modeCode[body.result.mode] || _this.platform.Characteristic.TargetHeaterCoolerState.AUTO;
                            _this.acStates.temperature = body.result.temp;
                            _this.acStates.fan = body.result.wind;
                            _this.service.updateCharacteristic(_this.platform.Characteristic.Active, _this.acStates.On);
                            _this.service.updateCharacteristic(_this.platform.Characteristic.TargetHeaterCoolerState, _this.acStates.mode);
                            _this.service.updateCharacteristic(_this.platform.Characteristic.CurrentTemperature, _this.acStates.temperature);
                            _this.service.updateCharacteristic(_this.platform.Characteristic.RotationSpeed, _this.acStates.fan);
                        }
                        setTimeout(_this.refreshStatus.bind(_this), 30000);
                    });
                };
                AirConditionerAccessory.prototype.setOn = function (value) {
                    var _this = this;
                    if (this.acStates.On == value)
                        return;
                    var command = value ? 1 : 0;
                    this.sendACCommand(this.parentId, this.accessory.context.device.id, "power", command, function (body) {
                        if (!body.success) {
                            _this.log.error("Failed to change status of ".concat(_this.accessory.displayName, " due to error ").concat(body.msg));
                        }
                        else {
                            _this.log.info("".concat(_this.accessory.displayName, " is now ").concat(command == 0 ? 'Off' : 'On'));
                            _this.acStates.On = value;
                        }
                    });
                };
                AirConditionerAccessory.prototype.getOn = function () {
                    return this.acStates.On;
                };
                AirConditionerAccessory.prototype.setHeatingCoolingState = function (value) {
                    var _this = this;
                    var val = value;
                    var command = 2;
                    if (val == this.platform.Characteristic.TargetHeaterCoolerState.COOL)
                        command = 0;
                    if (val == this.platform.Characteristic.TargetHeaterCoolerState.HEAT)
                        command = 1;
                    this.sendACCommand(this.parentId, this.accessory.context.device.id, "mode", command, function (body) {
                        if (!body.success) {
                            _this.log.error("Failed to change ".concat(_this.accessory.displayName, " mode due to error ").concat(body.msg));
                        }
                        else {
                            _this.log.info("".concat(_this.accessory.displayName, " mode is ").concat(_this.modeList[command]));
                            _this.acStates.mode = val;
                        }
                    });
                };
                AirConditionerAccessory.prototype.getHeatingCoolingState = function () {
                    return this.acStates.mode;
                };
                AirConditionerAccessory.prototype.getCoolingThresholdTemperatureCharacteristic = function () {
                    return this.acStates.temperature;
                };
                AirConditionerAccessory.prototype.setCoolingThresholdTemperatureCharacteristic = function (value) {
                    var _this = this;
                    var command = value;
                    this.sendACCommand(this.parentId, this.accessory.context.device.id, "temp", command, function (body) {
                        if (!body.success) {
                            _this.log.error("Failed to change ".concat(_this.accessory.displayName, " temperature due to error ").concat(body.msg));
                        }
                        else {
                            _this.log.info("".concat(_this.accessory.displayName, " temperature is set to ").concat(command, " degrees."));
                            _this.acStates.temperature = command;
                            _this.service.updateCharacteristic(_this.platform.Characteristic.CurrentTemperature, command);
                        }
                    });
                };
                AirConditionerAccessory.prototype.getRotationSpeedCharacteristic = function () {
                    return this.acStates.fan;
                };
                AirConditionerAccessory.prototype.setRotationSpeedCharacteristic = function (value) {
                    var _this = this;
                    //Change fan speed
                    var command = value;
                    this.sendACCommand(this.parentId, this.accessory.context.device.id, "wind", command, function (body) {
                        if (!body.success) {
                            _this.log.error("Failed to change ".concat(_this.accessory.displayName, " fan due to error ").concat(body.msg));
                        }
                        else {
                            _this.log.info("".concat(_this.accessory.displayName, " Fan is set to ").concat(command == 0 ? "auto" : command, "."));
                            _this.acStates.fan = command;
                        }
                    });
                };
                AirConditionerAccessory.prototype.getCurrentTemperature = function () {
                    return this.acStates.temperature;
                };
                AirConditionerAccessory.prototype.sendACCommand = function (deviceId, remoteId, command, value, cb) {
                    var commandObj = {
                        "code": command,
                        "value": value
                    };
                    this.log.debug(JSON.stringify(commandObj));
                    APIInvocationHelper_3.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + "/v2.0/infrareds/".concat(deviceId, "/air-conditioners/").concat(remoteId, "/command"), "POST", commandObj, function (body) {
                        cb(body);
                    });
                };
                AirConditionerAccessory.prototype.getACStatus = function (deviceId, remoteId, cb) {
                    this.log.debug("Getting AC Status");
                    APIInvocationHelper_3.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + "/v2.0/infrareds/".concat(deviceId, "/remotes/").concat(remoteId, "/ac/status"), "GET", {}, function (body) {
                        cb(body);
                    });
                };
                return AirConditionerAccessory;
            }(BaseAccessory_1.BaseAccessory));
            exports_9("AirConditionerAccessory", AirConditionerAccessory);
        }
    };
});
System.register("lib/accessories/FanAccessory", ["lib/accessories/BaseAccessory", "lib/api/APIInvocationHelper"], function (exports_10, context_10) {
    "use strict";
    var BaseAccessory_2, APIInvocationHelper_4, FanAccessory;
    var __moduleName = context_10 && context_10.id;
    return {
        setters: [
            function (BaseAccessory_2_1) {
                BaseAccessory_2 = BaseAccessory_2_1;
            },
            function (APIInvocationHelper_4_1) {
                APIInvocationHelper_4 = APIInvocationHelper_4_1;
            }
        ],
        execute: function () {
            /**
             * Fan Accessory
             * An instance of this class is created for each accessory your platform registers
             * Each accessory may expose multiple services of different service types.
             */
            FanAccessory = /** @class */ (function (_super) {
                __extends(FanAccessory, _super);
                function FanAccessory(platform, accessory) {
                    var _this = this;
                    var _a, _b;
                    _this = _super.call(this, platform, accessory) || this;
                    _this.platform = platform;
                    _this.accessory = accessory;
                    _this.fanStates = {
                        On: _this.platform.Characteristic.Active.INACTIVE,
                        speed: 50,
                        fan: 0,
                        swing: _this.platform.Characteristic.SwingMode.SWING_DISABLED
                    };
                    _this.powerCommand = 1;
                    _this.speedCommand = 9367;
                    _this.swingCommand = 9372;
                    _this.sendCommandAPIURL = accessory.context.device.diy ? "".concat(_this.configuration.apiHost, "/v2.0/infrareds/").concat(_this.parentId, "/remotes/").concat(accessory.context.device.id, "/learning-codes") : "".concat(_this.configuration.apiHost, "/v1.0/infrareds/").concat(_this.parentId, "/remotes/").concat(accessory.context.device.id, "/raw/command");
                    _this.sendCommandKey = accessory.context.device.diy ? 'code' : 'raw_key';
                    (_b = (_a = _this.accessory) === null || _a === void 0 ? void 0 : _a.getService(_this.platform.Service.AccessoryInformation)) === null || _b === void 0 ? void 0 : _b.setCharacteristic(_this.platform.Characteristic.Manufacturer, accessory.context.device.product_name).setCharacteristic(_this.platform.Characteristic.Model, 'Infrared Controlled Fan').setCharacteristic(_this.platform.Characteristic.SerialNumber, accessory.context.device.id);
                    _this.service = _this.accessory.getService(_this.platform.Service.Fanv2) || _this.accessory.addService(_this.platform.Service.Fanv2);
                    _this.service.setCharacteristic(_this.platform.Characteristic.Name, accessory.context.device.name);
                    _this.service.getCharacteristic(_this.platform.Characteristic.Active)
                        .onSet(_this.setOn.bind(_this))
                        .onGet(_this.getOn.bind(_this));
                    _this.service.getCharacteristic(_this.platform.Characteristic.RotationSpeed)
                        .onSet(_this.setRotationSpeed.bind(_this))
                        .onGet(_this.getRotationSpeed.bind(_this));
                    _this.service.getCharacteristic(_this.platform.Characteristic.SwingMode)
                        .onSet(_this.setSwingMode.bind(_this))
                        .onGet(_this.getSwingMode.bind(_this));
                    _this.getFanCommands(_this.parentId, accessory.context.device.id, accessory.context.device.diy, function (commands) {
                        if (commands) {
                            _this.log.debug("Setting DIY Commands for Fan as ".concat(JSON.stringify(commands)));
                            _this.powerCommand = commands.power;
                            _this.speedCommand = commands.speed;
                            _this.swingCommand = commands.swing;
                        }
                        else {
                            _this.log.warn("Failed to get commands for the fan. Defaulting to standard values. These may not work.");
                        }
                    });
                    return _this;
                }
                FanAccessory.prototype.setOn = function (value) {
                    var _this = this;
                    if (this.fanStates.On != value) {
                        this.sendFanCommand(this.powerCommand, function (body) {
                            if (!body.success) {
                                _this.log.error("Failed to change Fan status due to error ".concat(body.msg));
                            }
                            else {
                                _this.log.info("".concat(_this.accessory.displayName, " is now ").concat(value == 0 ? 'Off' : 'On'));
                                _this.fanStates.On = value;
                                if (_this.fanStates.On) {
                                    _this.service.updateCharacteristic(_this.platform.Characteristic.RotationSpeed, 50);
                                }
                            }
                        });
                    }
                };
                FanAccessory.prototype.getOn = function () {
                    return this.fanStates.On;
                };
                FanAccessory.prototype.getRotationSpeed = function () {
                    return this.fanStates.speed;
                };
                FanAccessory.prototype.setRotationSpeed = function () {
                    var _this = this;
                    this.sendFanCommand(this.speedCommand, function (body) {
                        if (!body.success) {
                            _this.log.error("Failed to change Fan speed due to error ".concat(body.msg));
                        }
                        else {
                            _this.log.info("".concat(_this.accessory.displayName, " speed is updated."));
                            _this.fanStates.speed = 50;
                            _this.service.updateCharacteristic(_this.platform.Characteristic.RotationSpeed, 50);
                        }
                    });
                };
                FanAccessory.prototype.getSwingMode = function () {
                    return this.fanStates.swing;
                };
                FanAccessory.prototype.setSwingMode = function (value) {
                    var _this = this;
                    this.sendFanCommand(this.swingCommand, function (body) {
                        if (!body.success) {
                            _this.log.error("Failed to change Fan swing due to error ".concat(body.msg));
                        }
                        else {
                            _this.log.info("".concat(_this.accessory.displayName, " swing is updated."));
                            _this.fanStates.swing = value;
                        }
                    });
                };
                FanAccessory.prototype.getFanCommands = function (irDeviceId, remoteId, isDiy, callback) {
                    var _this = this;
                    if (isDiy === void 0) { isDiy = false; }
                    this.log.debug("Getting commands for Fan...");
                    if (isDiy) {
                        this.log.debug("Getting commands for DIY Fan...");
                        APIInvocationHelper_4.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + "/v2.0/infrareds/".concat(irDeviceId, "/remotes/").concat(remoteId, "/learning-codes"), "GET", {}, function (codesBody) {
                            if (codesBody.success) {
                                _this.log.debug("Received codes. Returning all available codes");
                                callback(_this.getIRCodesFromAPIResponse(codesBody));
                            }
                            else {
                                _this.log.error("Failed to get codes for DIY Fan", codesBody.msg);
                                callback();
                            }
                        });
                    }
                    else {
                        this.log.debug("First getting brand id and remote id for given device...");
                        APIInvocationHelper_4.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, "".concat(this.configuration.apiHost, "/v2.0/infrareds/").concat(irDeviceId, "/remotes/").concat(remoteId, "/keys"), 'GET', {}, function (body) {
                            if (body.success) {
                                _this.log.debug("Found category id: ".concat(body.result.category_id, ", brand id: ").concat(body.result.brand_id, ", remote id: ").concat(body.result.remote_index));
                                APIInvocationHelper_4.APIInvocationHelper.invokeTuyaIrApi(_this.log, _this.configuration, _this.configuration.apiHost + "/v2.0/infrareds/".concat(irDeviceId, "/categories/").concat(body.result.category_id, "/brands/").concat(body.result.brand_id, "/remotes/").concat(body.result.remote_index, "/rules"), "GET", {}, function (codesBody) {
                                    if (codesBody.success) {
                                        _this.log.debug("Received codes. Returning all available codes");
                                        callback(_this.getIRCodesFromAPIResponse(codesBody));
                                    }
                                    else {
                                        _this.log.warn("Failed to get custom codes for fan. Trying to use standard codes...", codesBody.msg);
                                        callback(_this.getStandardIRCodesFromAPIResponse(body));
                                    }
                                });
                            }
                            else {
                                _this.log.error("Failed to get fan key details", body.msg);
                                callback();
                            }
                        });
                    }
                };
                FanAccessory.prototype.sendFanCommand = function (command, cb) {
                    var _a;
                    var commandObj = (_a = {}, _a[this.sendCommandKey] = command, _a);
                    APIInvocationHelper_4.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.sendCommandAPIURL, "POST", commandObj, function (body) {
                        cb(body);
                    });
                };
                FanAccessory.prototype.getIRCodeFromKey = function (item, key) {
                    if (item.key_name === key) {
                        return item.key_id || item.key;
                    }
                };
                FanAccessory.prototype.getIRCodesFromAPIResponse = function (apiResponse) {
                    var ret = { power: this.powerCommand, speed: this.speedCommand, swing: this.swingCommand };
                    for (var i = 0; i < apiResponse.result.length; i++) {
                        var codeItem = apiResponse.result[i];
                        ret.power = ret.power || this.getIRCodeFromKey(codeItem, "power");
                        ret.speed = ret.speed || this.getIRCodeFromKey(codeItem, "fan_speed");
                        ret.swing = ret.swing || this.getIRCodeFromKey(codeItem, "swing");
                    }
                    return ret;
                };
                FanAccessory.prototype.getStandardIRCodesFromAPIResponse = function (apiResponse) {
                    var ret = { power: null, speed: null, swing: null };
                    for (var i = 0; i < apiResponse.result.key_list.length; i++) {
                        var codeItem = apiResponse.result.key_list[i];
                        ret.power = ret.power || this.getIRCodeFromKey(codeItem, "power");
                        ret.speed = ret.speed || this.getIRCodeFromKey(codeItem, "fan_speed");
                        ret.swing = ret.swing || this.getIRCodeFromKey(codeItem, "swing");
                    }
                    return ret;
                };
                return FanAccessory;
            }(BaseAccessory_2.BaseAccessory));
            exports_10("FanAccessory", FanAccessory);
        }
    };
});
System.register("lib/accessories/GenericAccessory", ["lib/api/APIInvocationHelper", "lib/accessories/BaseAccessory"], function (exports_11, context_11) {
    "use strict";
    var APIInvocationHelper_5, BaseAccessory_3, GenericAccessory;
    var __moduleName = context_11 && context_11.id;
    return {
        setters: [
            function (APIInvocationHelper_5_1) {
                APIInvocationHelper_5 = APIInvocationHelper_5_1;
            },
            function (BaseAccessory_3_1) {
                BaseAccessory_3 = BaseAccessory_3_1;
            }
        ],
        execute: function () {
            /**
             * Generic Accessory
             * An instance of this class is created for each accessory your platform registers
             * Each accessory may expose multiple services of different service types.
             */
            GenericAccessory = /** @class */ (function (_super) {
                __extends(GenericAccessory, _super);
                function GenericAccessory(platform, accessory) {
                    var _this = this;
                    var _a;
                    _this = _super.call(this, platform, accessory) || this;
                    _this.platform = platform;
                    _this.accessory = accessory;
                    _this.switchStates = {
                        On: _this.platform.Characteristic.Active.INACTIVE
                    };
                    _this.powerCommand = 1;
                    _this.sendCommandAPIURL = "".concat(_this.configuration.apiHost, "/v1.0/infrareds/").concat(_this.parentId, "/remotes/").concat(accessory.context.device.id, "/raw/command");
                    // set accessory information
                    (_a = _this.accessory.getService(_this.platform.Service.AccessoryInformation)) === null || _a === void 0 ? void 0 : _a.setCharacteristic(_this.platform.Characteristic.Manufacturer, accessory.context.device.product_name).setCharacteristic(_this.platform.Characteristic.Model, 'Infrared Controlled Switch').setCharacteristic(_this.platform.Characteristic.SerialNumber, accessory.context.device.id);
                    _this.service = _this.accessory.getService(_this.platform.Service.Switch) || _this.accessory.addService(_this.platform.Service.Switch);
                    _this.service.setCharacteristic(_this.platform.Characteristic.Name, accessory.context.device.name);
                    _this.service.getCharacteristic(_this.platform.Characteristic.On)
                        .onSet(_this.setOn.bind(_this))
                        .onGet(_this.getOn.bind(_this));
                    return _this;
                }
                GenericAccessory.prototype.setOn = function (value) {
                    var _this = this;
                    if (this.switchStates.On != value) {
                        this.sendCommand(this.powerCommand, function (body) {
                            if (!body.success) {
                                _this.log.error("Failed to change ".concat(_this.accessory.displayName, " status due to error ").concat(body.msg));
                            }
                            else {
                                _this.log.info("".concat(_this.accessory.displayName, " is now ").concat(value == 0 ? 'Off' : 'On'));
                                _this.switchStates.On = value;
                            }
                        });
                    }
                };
                GenericAccessory.prototype.getOn = function () {
                    return this.switchStates.On;
                };
                GenericAccessory.prototype.sendCommand = function (command, cb) {
                    var commandObj = { 'raw_key': command };
                    APIInvocationHelper_5.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.sendCommandAPIURL, "POST", commandObj, function (body) {
                        cb(body);
                    });
                };
                return GenericAccessory;
            }(BaseAccessory_3.BaseAccessory));
            exports_11("GenericAccessory", GenericAccessory);
        }
    };
});
System.register("lib/accessories/DoItYourselfAccessory", ["lib/api/APIInvocationHelper", "lib/accessories/BaseAccessory"], function (exports_12, context_12) {
    "use strict";
    var APIInvocationHelper_6, BaseAccessory_4, DoItYourselfAccessory;
    var __moduleName = context_12 && context_12.id;
    return {
        setters: [
            function (APIInvocationHelper_6_1) {
                APIInvocationHelper_6 = APIInvocationHelper_6_1;
            },
            function (BaseAccessory_4_1) {
                BaseAccessory_4 = BaseAccessory_4_1;
            }
        ],
        execute: function () {
            /**
             * Do It Yourself Accessory
             * An instance of this class is created for each accessory your platform registers
             * Each accessory may expose multiple services of different service types.
             */
            DoItYourselfAccessory = /** @class */ (function (_super) {
                __extends(DoItYourselfAccessory, _super);
                function DoItYourselfAccessory(platform, accessory) {
                    var _this = this;
                    var _a;
                    _this = _super.call(this, platform, accessory) || this;
                    _this.platform = platform;
                    _this.accessory = accessory;
                    // set accessory information
                    (_a = _this.accessory.getService(_this.platform.Service.AccessoryInformation)) === null || _a === void 0 ? void 0 : _a.setCharacteristic(_this.platform.Characteristic.Manufacturer, accessory.context.device.product_name).setCharacteristic(_this.platform.Characteristic.Model, 'Infrared Controlled Switch').setCharacteristic(_this.platform.Characteristic.SerialNumber, accessory.context.device.id);
                    _this.fetchLearningCodes(_this.accessory.context.device.ir_id, _this.accessory.context.device.id, function (body) {
                        if (!body.success) {
                            _this.log.error("Failed to fetch learning codes due to error ".concat(body.msg));
                        }
                        else {
                            _this.accessory.context.device.codes = body.result;
                            // Cleaning accessories
                            var uuids = _this.accessory.context.device.codes.map(function (code) { return _this.platform.api.hap.uuid.generate(code.key_name); });
                            for (var service_index = _this.accessory.services.length - 1; service_index >= 0; service_index--) {
                                var service = _this.accessory.services[service_index];
                                if (service.constructor.name === _this.platform.api.hap.Service.Switch.name) {
                                    if (!uuids.includes(service.subtype)) {
                                        _this.accessory.removeService(service);
                                    }
                                }
                            }
                            var _loop_2 = function (code) {
                                _this.log.debug("Adding code ".concat(code.key_name));
                                var service = _this.accessory.getService(_this.platform.api.hap.uuid.generate(code.key_name)) || accessory.addService(_this.platform.api.hap.Service.Switch, code.key_name, _this.platform.api.hap.uuid.generate(code.key_name), code.key);
                                service.getCharacteristic(_this.platform.Characteristic.On)
                                    .onGet(function () {
                                    return false;
                                })
                                    .onSet((function (value) {
                                    if (value) {
                                        _this.sendLearningCode(_this.accessory.context.device.ir_id, _this.accessory.context.device.id, code.code, function (body) {
                                            if (!body.success) {
                                                _this.log.error("Failed to fetch learning codes due to error ".concat(body.msg));
                                            }
                                            service.setCharacteristic(_this.platform.Characteristic.On, false);
                                        });
                                    }
                                }));
                            };
                            for (var _i = 0, _a = _this.accessory.context.device.codes; _i < _a.length; _i++) {
                                var code = _a[_i];
                                _loop_2(code);
                            }
                        }
                    });
                    return _this;
                }
                DoItYourselfAccessory.prototype.sendLearningCode = function (deviceId, remoteId, code, cb) {
                    this.log.debug("Sending Learning Code");
                    APIInvocationHelper_6.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + "/v2.0/infrareds/".concat(deviceId, "/remotes/").concat(remoteId, "/learning-codes"), "POST", { code: code }, function (body) {
                        cb(body);
                    });
                };
                DoItYourselfAccessory.prototype.fetchLearningCodes = function (deviceId, remoteId, cb) {
                    var _this = this;
                    this.log.debug("Getting Learning Codes");
                    APIInvocationHelper_6.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.configuration.apiHost + "/v2.0/infrareds/".concat(deviceId, "/remotes/").concat(remoteId, "/learning-codes"), "GET", {}, function (body) {
                        _this.log.debug("Received learning codes ".concat(JSON.stringify(body)));
                        cb(body);
                    });
                };
                return DoItYourselfAccessory;
            }(BaseAccessory_4.BaseAccessory));
            exports_12("DoItYourselfAccessory", DoItYourselfAccessory);
        }
    };
});
System.register("lib/accessories/LightAccessory", ["lib/accessories/BaseAccessory", "lib/api/APIInvocationHelper"], function (exports_13, context_13) {
    "use strict";
    var BaseAccessory_5, APIInvocationHelper_7, LightAccessory;
    var __moduleName = context_13 && context_13.id;
    return {
        setters: [
            function (BaseAccessory_5_1) {
                BaseAccessory_5 = BaseAccessory_5_1;
            },
            function (APIInvocationHelper_7_1) {
                APIInvocationHelper_7 = APIInvocationHelper_7_1;
            }
        ],
        execute: function () {
            /**
             * Light Accessory
             * An instance of this class is created for each accessory your platform registers
             * Each accessory may expose multiple services of different service types.
             */
            LightAccessory = /** @class */ (function (_super) {
                __extends(LightAccessory, _super);
                function LightAccessory(platform, accessory) {
                    var _this = this;
                    var _a, _b;
                    _this = _super.call(this, platform, accessory) || this;
                    _this.platform = platform;
                    _this.accessory = accessory;
                    _this.lightState = {
                        On: false,
                        brightness: 50
                    };
                    _this.sendCommandAPIURL = "".concat(_this.configuration.apiHost, "/v1.0/iot-03/devices/").concat(accessory.context.device.id, "/commands");
                    (_b = (_a = _this.accessory) === null || _a === void 0 ? void 0 : _a.getService(_this.platform.Service.AccessoryInformation)) === null || _b === void 0 ? void 0 : _b.setCharacteristic(_this.platform.Characteristic.Manufacturer, accessory.context.device.product_name).setCharacteristic(_this.platform.Characteristic.Model, 'Infrared Controlled Light').setCharacteristic(_this.platform.Characteristic.SerialNumber, accessory.context.device.id);
                    _this.service = _this.accessory.getService(_this.platform.Service.Lightbulb) || _this.accessory.addService(_this.platform.Service.Lightbulb);
                    _this.service.setCharacteristic(_this.platform.Characteristic.Name, accessory.context.device.name);
                    _this.service.getCharacteristic(_this.platform.Characteristic.On)
                        .onSet(_this.setOn.bind(_this))
                        .onGet(_this.getOn.bind(_this));
                    _this.service.getCharacteristic(_this.platform.Characteristic.Brightness)
                        .onSet(_this.setBrightness.bind(_this))
                        .onGet(_this.getBrightness.bind(_this));
                    return _this;
                }
                LightAccessory.prototype.setOn = function (value) {
                    var _this = this;
                    if (value !== this.lightState.On) {
                        var command = value ? "PowerOn" : "PowerOff";
                        this.sendLightCommand(command, function (body) {
                            if (!body.success) {
                                _this.log.error("Failed to change ".concat(_this.accessory.displayName, " status due to error ").concat(body.msg));
                            }
                            else {
                                _this.log.info("".concat(_this.accessory.displayName, " is now ").concat(value == 0 ? 'Off' : 'On'));
                                _this.lightState.On = value;
                            }
                        });
                    }
                };
                LightAccessory.prototype.getOn = function () {
                    return this.lightState.On;
                };
                LightAccessory.prototype.getBrightness = function () {
                    return this.lightState.brightness;
                };
                LightAccessory.prototype.setBrightness = function (value) {
                    var _this = this;
                    var command = value <= this.lightState.brightness ? "Brightness-" : "Brightness+";
                    this.sendLightCommand(command, function (body) {
                        if (!body.success) {
                            _this.log.error("Failed to change ".concat(_this.accessory.displayName, " brightness due to error ").concat(body.msg));
                        }
                        else {
                            _this.log.info("".concat(_this.accessory.displayName, " is brightness is now ").concat(command === "Brightness+" ? 'increased' : 'decreased'));
                            //this.lightState.brightness = 50;
                            if (_this.lightState.On) {
                                _this.log.debug("Resetting slider to 50%");
                                _this.service.updateCharacteristic(_this.platform.Characteristic.Brightness, 50);
                            }
                        }
                    });
                };
                LightAccessory.prototype.sendLightCommand = function (command, cb) {
                    var commandObj = { "commands": [{ "code": command, "value": 1 }] };
                    APIInvocationHelper_7.APIInvocationHelper.invokeTuyaIrApi(this.log, this.configuration, this.sendCommandAPIURL, "POST", commandObj, function (body) {
                        cb(body);
                    });
                };
                return LightAccessory;
            }(BaseAccessory_5.BaseAccessory));
            exports_13("LightAccessory", LightAccessory);
        }
    };
});
System.register("platform", ["lib/TuyaIRDiscovery", "lib/accessories/AirConditionerAccessory", "lib/accessories/FanAccessory", "lib/accessories/GenericAccessory", "lib/accessories/DoItYourselfAccessory", "lib/accessories/LightAccessory"], function (exports_14, context_14) {
    "use strict";
    var TuyaIRDiscovery_1, AirConditionerAccessory_1, FanAccessory_1, GenericAccessory_1, DoItYourselfAccessory_1, LightAccessory_1, PLATFORM_NAME, PLUGIN_NAME, CLASS_DEF, TuyaIRPlatform;
    var __moduleName = context_14 && context_14.id;
    return {
        setters: [
            function (TuyaIRDiscovery_1_1) {
                TuyaIRDiscovery_1 = TuyaIRDiscovery_1_1;
            },
            function (AirConditionerAccessory_1_1) {
                AirConditionerAccessory_1 = AirConditionerAccessory_1_1;
            },
            function (FanAccessory_1_1) {
                FanAccessory_1 = FanAccessory_1_1;
            },
            function (GenericAccessory_1_1) {
                GenericAccessory_1 = GenericAccessory_1_1;
            },
            function (DoItYourselfAccessory_1_1) {
                DoItYourselfAccessory_1 = DoItYourselfAccessory_1_1;
            },
            function (LightAccessory_1_1) {
                LightAccessory_1 = LightAccessory_1_1;
            }
        ],
        execute: function () {
            PLATFORM_NAME = 'TuyaIR';
            PLUGIN_NAME = 'homebridge-tuya-ir';
            CLASS_DEF = {
                infrared_ac: AirConditionerAccessory_1.AirConditionerAccessory,
                infrared_fan: FanAccessory_1.FanAccessory,
                qt: DoItYourselfAccessory_1.DoItYourselfAccessory,
                infrared_light: LightAccessory_1.LightAccessory
            };
            /**
             * HomebridgePlatform
             * This class is the main constructor for your plugin, this is where you should
             * parse the user config and discover/register accessories with Homebridge.
             */
            TuyaIRPlatform = /** @class */ (function () {
                function TuyaIRPlatform(log, config, api) {
                    var _this = this;
                    this.log = log;
                    this.config = config;
                    this.api = api;
                    this.Service = this.api.hap.Service;
                    this.Characteristic = this.api.hap.Characteristic;
                    // this is used to track restored cached accessories
                    this.accessories = [];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    this.cachedAccessories = new Map();
                    this.foundAccessories = [];
                    this.log.debug('Finished initializing platform:', this.config.name);
                    // When this event is fired it means Homebridge has restored all cached accessories from disk.
                    // Dynamic Platform plugins should only register new accessories after this event was fired,
                    // in order to ensure they weren't added to homebridge already. This event can also be used
                    // to start discovery of new accessories.
                    this.api.on('didFinishLaunching', function () {
                        log.debug('Executed didFinishLaunching callback');
                        _this.discoverDevices();
                    });
                }
                /**
                 * This function is invoked when homebridge restores cached accessories from disk at startup.
                 * It should be used to setup event handlers for characteristics and update respective values.
                 */
                TuyaIRPlatform.prototype.configureAccessory = function (accessory) {
                    this.log.info('Loading accessory from cache:', accessory.displayName);
                    // add the restored accessory to the accessories cache so we can track if it has already been registered
                    this.accessories.push(accessory);
                };
                /**
                 * This is an example method showing how to register discovered accessories.
                 * Accessories must only be registered once, previously created accessories
                 * must not be registered again to prevent "duplicate UUID" errors.
                 */
                TuyaIRPlatform.prototype.discoverDevices = function () {
                    //if (!this.config.devices) return this.log.error("No devices configured. Please configure atleast one device.");
                    if (!this.config.tuyaAPIClientId)
                        return this.log.error("Client ID is not configured. Please check your config.json");
                    if (!this.config.tuyaAPISecret)
                        return this.log.error("Client Secret is not configured. Please check your config.json");
                    if (!this.config.deviceRegion)
                        return this.log.error("Region is not configured. Please check your config.json");
                    //if (!this.config.deviceId) return this.log.error("IR Blaster device ID is not configured. Please check your config.json");
                    this.log.info('Starting discovery...');
                    var tuya = new TuyaIRDiscovery_1.TuyaIRDiscovery(this.log, this.config);
                    this.discover(tuya, 0, this.config.smartIR.length);
                };
                TuyaIRPlatform.prototype.discover = function (tuya, i, total) {
                    var _this = this;
                    this.log.debug("Starting discovery for device number ".concat(i));
                    tuya.startDiscovery(i, function (devices, index) {
                        var _loop_3 = function (device) {
                            if (device) {
                                // generate a unique id for the accessory this should be generated from
                                // something globally unique, but constant, for example, the device serial
                                // number or MAC address
                                device.ir_id = _this.config.smartIR[index].deviceId;
                                var Accessory = CLASS_DEF[device.category] || (device.diy ? DoItYourselfAccessory_1.DoItYourselfAccessory : GenericAccessory_1.GenericAccessory);
                                var uuid_1 = _this.api.hap.uuid.generate(device.id);
                                // see if an accessory with the same uuid has already been registered and restored from
                                // the cached devices we stored in the `configureAccessory` method above
                                var existingAccessory = _this.accessories.find(function (accessory) { return accessory.UUID === uuid_1; });
                                if (existingAccessory) {
                                    // the accessory already exists
                                    _this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                                    // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                                    // existingAccessory.context.device = device;
                                    // this.api.updatePlatformAccessories([existingAccessory]);
                                    // create the accessory handler for the restored accessory
                                    // this is imported from `platformAccessory.ts`
                                    existingAccessory.context.device = device;
                                    _this.foundAccessories.push(existingAccessory);
                                    if (Accessory) {
                                        _this.api.updatePlatformAccessories([existingAccessory]);
                                        new Accessory(_this, existingAccessory);
                                    }
                                    else {
                                        _this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
                                        _this.log.warn("Removing unsupported accessory '".concat(existingAccessory.displayName, "'..."));
                                    }
                                    // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                                    // remove platform accessories when no longer present
                                    // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
                                    // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
                                }
                                else {
                                    if (Accessory) {
                                        // the accessory does not yet exist, so we need to create it
                                        _this.log.info('Adding new accessory:', device.name);
                                        // create a new accessory
                                        var accessory = new _this.api.platformAccessory(device.name, uuid_1);
                                        // store a copy of the device object in the `accessory.context`
                                        // the `context` property can be used to store any data about the accessory you may need
                                        accessory.context.device = device;
                                        //foundAccessories.push(accessory);
                                        // create the accessory handler for the newly create accessory
                                        // this is imported from `platformAccessory.ts`
                                        new Accessory(_this, accessory);
                                        // link the accessory to your platform
                                        _this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                                    }
                                    else {
                                        _this.log.warn("Unsupported accessory '".concat(device.name, "'..."));
                                    }
                                }
                            }
                        };
                        //loop over the discovered devices and register each one if it has not already been registered
                        for (var _i = 0, devices_1 = devices; _i < devices_1.length; _i++) {
                            var device = devices_1[_i];
                            _loop_3(device);
                        }
                        i++;
                        if (i < total) {
                            _this.discover(tuya, i, total);
                        }
                        else {
                            //Remove accessories removed from config.
                            var accessoriesToRemove = _this.accessories.filter(function (acc) { return !_this.foundAccessories.some(function (foundAccessory) { return foundAccessory.UUID === acc.UUID; }); });
                            if (accessoriesToRemove.length > 0) {
                                _this.log.info("Removing ".concat(accessoriesToRemove.length, " accessories as they are no longer configured..."));
                                _this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, accessoriesToRemove);
                            }
                            _this.foundAccessories.splice(0, _this.foundAccessories.length);
                        }
                    });
                };
                return TuyaIRPlatform;
            }());
            exports_14("TuyaIRPlatform", TuyaIRPlatform);
        }
    };
});
System.register("index", ["platform"], function (exports_15, context_15) {
    "use strict";
    var platform_1, PLATFORM_NAME;
    var __moduleName = context_15 && context_15.id;
    return {
        setters: [
            function (platform_1_1) {
                platform_1 = platform_1_1;
            }
        ],
        execute: function () {
            PLATFORM_NAME = 'TuyaIR';
        }
    };
});
