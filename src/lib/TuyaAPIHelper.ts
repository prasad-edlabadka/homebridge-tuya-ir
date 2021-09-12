import { Logger } from "homebridge";
import { Config } from "./Config";

const CryptoJS = require('crypto-js');
const request = require('request');
const URL = require('url');

export class TuyaAPIHelper {
    private constructor(config: Config, log: Logger) {
        this.clientId = config.client_id;
        this.clientSecret = config.secret;
        this.apiHost = `https://openapi.tuya${config.region}.com`;
        this.log = log;
        this.config = config;
    }

    private accessToken: string = "";
    private refreshToken: string = "";
    private clientId: string = "";
    private clientSecret: string = "";
    private apiHost: string = "";
    private timestamp: number = new Date().getTime();
    private signKey: string = "";
    private log: Logger;
    private config: Config;
    private static _instance: TuyaAPIHelper;

    public static Instance(config: Config, log: Logger) {
        return this._instance || (this._instance = new this(config, log));
    }

    login(cb) {
        this.log.info(`Logging in to the the server ${this.apiHost}...`);
        this._loginApiCall(this.apiHost + "/v1.0/token?grant_type=1", {}, (_body) => {
            var body = JSON.parse(_body);
            if (body.success) {
                this.log.info(`Login successful.`);
                this.accessToken = body.result.access_token;
                this.refreshToken = body.result.refresh_token;
                setTimeout(() => {
                    this._refreshToken();
                }, (body.result.expire_time - 5) * 1000);
                cb();
            } else {
                this.log.error(`Failed to login due to error '${body.msg}'. Retying after 1 minute...`);
                setTimeout(() => {
                    this.login(cb);
                }, 60000);
            }
        });
    }

    fetchDevices(deviceId: string, cb) {
        this.log.debug(`This is the config: ${JSON.stringify(this.config)}`);
        if (!this.config.autoFetchRemotes) {
            this.log.info("Auto discovery of remotes disabled...");
            this._manualFetch(cb);
        } else {
            this._apiCall(this.apiHost + `/v1.0/infrareds/${deviceId}/remotes`, "GET", {}, (_body, err) => {
                if (err) {
                    this.log.error("Failed to get remotes device: " + deviceId);
                    cb([]);
                } else {
                    var body = JSON.parse(_body);
                    var devs: any[] = [];
                    if (!body.result) {
                        this.log.warn("API didn't return any devices Using hardcoded devices...");
                        this._manualFetch(cb);
                    } else {
                        this.log.warn(`API returned ${body.result.length} remotes...`);
                        for (var i = 0; i < body.result.length; i++) {
                            this._apiCall(this.apiHost + `/v1.0/devices/${body.result[i].remote_id}`, "GET", {}, (_b, err) => {
                                if (err) {
                                    this.log.error("Failed to get remote configuration for: " + body.result[i].remote_id);
                                    devs.push({});
                                } else {
                                    this.log.debug(_b)
                                    devs.push(JSON.parse(_b).result);
                                }
                                if (devs.length == body.result.length) {
                                    cb(devs);
                                }
                            });
                        }
                    }
                }

            })
        }
    }

    _manualFetch(cb) {
        var devs: any[] = [];
        for (var i = 0; i < this.config.devices.length; i++) {
            var dev = this.config.devices[i];
            this._apiCall(this.apiHost + `/v1.0/devices/${dev.id}`, "GET", {}, (_b, err) => {

                if (err) {
                    this.log.error("Failed to get remote configuration for: " + dev.id);
                    devs.push({});
                } else {
                    this.log.debug(_b);
                    let bd = JSON.parse(_b);
                    if (!bd.success) {
                        this.log.error("Failed to get remote configuration for: " + dev.id);
                        this.log.error(`Server returned error: '${bd.msg}'`)
                        devs.push({});
                    } else {
                        bd.result.diy = dev.diy;
                        devs.push(bd.result);
                    }
                }
                if (devs.length == this.config.devices.length) {
                    cb(devs);
                }
            });
        }
    }

    sendACCommand(deviceId: string, remoteId: string, command: string, value: string | number, cb) {
        let commandObj = {
            "code": command,
            "value": value
        }
        this.log.debug(JSON.stringify(commandObj));
        this._apiCall(this.apiHost + `/v1.0/infrareds/${deviceId}/air-conditioners/${remoteId}/command`, "POST", commandObj, (_body, err) => {
            var body = { success: false, msg: "Failed to invoke API" };
            if (!err) {
                body = JSON.parse(_body);
            }
            cb(body);
        })
    }

    sendFanCommand(deviceId: string, remoteId: string, command: string | number, diy: boolean = false, cb) {
        var commandObj = diy ? {
            "code": command
        } : {
            "raw_key": command
        };

        var url = diy ? `${this.apiHost}/v1.0/infrareds/${deviceId}/remotes/${remoteId}/learning-codes` : `${this.apiHost}/v1.0/infrareds/${deviceId}/remotes/${remoteId}/raw/command`;

        this.log.debug(JSON.stringify(commandObj));
        this._apiCall(url, "POST", commandObj, (_body, err) => {
            var body = { success: false, msg: "Failed to invoke API" };
            if (!err) {
                body = JSON.parse(_body);
            }
            cb(body);
        })
    }

    getFanCommands(deviceId: string, remoteId: string, diy: boolean = false, cb) {
        this.log.debug("Getting commands for Fan...");
        if (diy) {
            this.log.debug("Getting commands for DIY Fan...");
            this._apiCall(this.apiHost + `/v1.0/infrareds/${deviceId}/remotes/${remoteId}/learning-codes`, "GET", {}, (_body, err) => {
                var body;
                if (!err) {
                    body = JSON.parse(_body);
                    if (body.success) {
                        let ret = { power: "", speed: "", swing: "" };
                        for (var i = 0; i < body.result.length; i++) {
                            let k = body.result[i];
                            if (k.key_name == 'power') {
                                ret.power = k.code;
                            } else if (k.key_name == 'fan_speed') {
                                ret.speed = k.code;
                            } else if (k.key_name == 'swing') {
                                ret.swing = k.code;
                            }
                        }
                        cb(ret);
                    } else {
                        this.log.error("Failed to invoke API");
                        cb();
                    }
                } else {
                    this.log.error("Failed to invoke API", err);
                    cb();
                }
            })
        } else {
            this.log.debug("First getting brand id and remote id for given device...");
            this._apiCall(this.apiHost + `/v1.0/infrareds/${deviceId}/remotes/${remoteId}/keys`, "GET", {}, (_body, err) => {
                var body;
                if (!err) {
                    body = JSON.parse(_body);
                    this.log.debug(`Found category id: ${body.result.category_id}, brand id: ${body.result.brand_id}, remote id: ${body.result.remote_index}`)
                    this._apiCall(this.apiHost + `/v1.0/infrareds/${deviceId}/categories/${body.result.category_id}/brands/${body.result.brand_id}/remotes/${body.result.remote_index}/rules`, "GET", {}, (_body2, err2) => {
                        if (!err2) {
                            let body2 = JSON.parse(_body2);
                            let ret = { power: "", speed: "", swing: "" };
                            for (var i = 0; i < body2.result.length; i++) {
                                let k = body2.result[i];
                                if (k.key_name == 'power') {
                                    ret.power = k.key;
                                } else if (k.key_name == 'fan_speed') {
                                    ret.speed = k.key;
                                } else if (k.key_name == 'swing') {
                                    ret.swing = k.key;
                                }
                            }
                            cb(ret);
                        } else {
                            this.log.error("Failed to invoke API", err2);
                            cb();
                        }
                    });
                } else {
                    this.log.error("Failed to invoke API", err);
                    cb();
                }
            })
        }
    }

    _refreshToken() {
        this.log.info("Need to refresh token now...");
        var _this = this;
        this._loginApiCall(this.apiHost + "/v1.0/token/" + this.refreshToken, {}, (_body) => {
            var body = JSON.parse(_body);
            if (body.success) {
                _this.accessToken = body.result.access_token;
                _this.refreshToken = body.result.refresh_token;
                _this.log.info(`Token refreshed successfully. Next refresh after ${body.result.expire_time} seconds`);
                setTimeout(() => {
                    this._refreshToken();
                }, (body.result.expire_time - 5) * 1000);
            } else {
                _this.log.error(`Unable to refresh token: ${body.msg}. Trying fresh login...`);
                this.login(() => { });
            }
        });
    }

    _calculateSign(withAccessToken: boolean, query: string, url: string, httpMethod: string, body: string = "") {
        this.timestamp = new Date().getTime();
        var signMap = this._stringToSign(query, url, httpMethod, body)
        var signStr = signMap["signUrl"]
        var str = withAccessToken ? this.clientId + this.accessToken + this.timestamp + signStr : this.clientId + this.timestamp + signStr;
        this.signKey = CryptoJS.HmacSHA256(str, this.clientSecret).toString().toUpperCase();
    }

    _loginApiCall(endpoint: string, body: object, cb) {
        var _this = this;
        let url = URL.parse(endpoint, true);

        this._calculateSign(false, url.query, url.pathname, 'GET');
        var options = {
            url: endpoint,
            headers: {
                'client_id': this.clientId,
                'sign': this.signKey,
                't': this.timestamp,
                'sign_method': 'HMAC-SHA256',
                'nonce': ''
            }
        };

        request.get(options, function (error, response, body) {
            _this.log.debug("API call successful.");
            cb(body);
        })
            .on('error', (err) => {
                _this.log.error("API call failed.");
                _this.log.error(err);
            })
    }
    _apiCall(endpoint: string, method: string, body: object, cb) {
        this.log.debug(`Calling endpoint ${endpoint}`);
        var _this = this;
        let url = URL.parse(endpoint, true);
        this._calculateSign(true, url.query, url.pathname, method, JSON.stringify(body));
        var options = {
            method: method,
            url: endpoint,
            headers: {
                'client_id': this.clientId,
                'sign': this.signKey,
                't': this.timestamp,
                'access_token': this.accessToken,
                'sign_method': 'HMAC-SHA256',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        };
        request(options, function (error, response, body) {
            // body is the decompressed response body
            _this.log.debug("API call successful.");
            _this.log.debug(body);
            cb(body, error);
        })
            .on('error', (err) => {
                _this.log.error("API call failed.");
                _this.log.error(err);
            })
    }

    // Generate signature string
    _stringToSign(query, url, method, body) {
        var sha256 = "";
        var headersStr = "";
        var map = {};
        var arr = [];
        var bodyStr = body || "";
        if (query) {
            this.toJsonObj(query, arr, map);
        }
        sha256 = CryptoJS.SHA256(bodyStr);
        if (arr.length > 0) {
            arr = arr.sort();
            url += '?';
            arr.forEach(function (item) {
                url += item + "=" + map[item] + "&";
            });
            url = url.substring(0, url.length - 1);
        }

        map["signUrl"] = method + "\n" + sha256 + "\n" + headersStr + "\n" + url;
        map["url"] = url;
        return map;
    }

    toJsonObj(params, arr, map) {
        var jsonBodyStr = JSON.stringify(params);
        var jsonBody = JSON.parse(jsonBodyStr);
        for (var key in jsonBody) {
            arr.push(key);
            map[key] = jsonBody[key];
        }
    }


}
