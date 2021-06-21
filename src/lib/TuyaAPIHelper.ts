import { Logger } from "homebridge";
import { Config } from "./Config";

const CryptoJS = require('crypto-js');
const request = require('request');
import https from 'https';

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
        this._apiCall(this.apiHost + `/v1.0/infrareds/${deviceId}/remotes`, "GET", {}, (_body, err) => {
            if (err) {
                this.log.error("Failed to get remotes device: " + deviceId);
                cb([]);
            } else {
                var body = JSON.parse(_body);
                var devs: any[] = [];
                if (body.result.length == 0) {
                    this.log.warn("API didn't return any devices Using hardcoded devices...");
                    for (var i = 0; i < this.config.devices.length; i++) {
                        this._apiCall(this.apiHost + `/v1.0/devices/${this.config.devices[i].remoteId}`, "GET", {}, (_b, err) => {
                            if (err) {
                                this.log.error("Failed to get remote configuration for: " + this.config.devices[i].remoteId);
                                devs.push({});
                            } else {
                                this.log.debug(_b)
                                devs.push(JSON.parse(_b).result);
                            }
                            if (devs.length == this.config.devices.length) {
                                cb(devs);
                            }
                        });
                    }
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
                            if (devs.length == this.config.devices.length) {
                                cb(devs);
                            }
                        });
                    }
                }
            }
        })
    }

    sendACCommand(deviceId: string, remoteId: string, command: string, value: string | number, cb) {
        let commandObj = {
            "code": command,
            "value": value
        }
        this.log.debug(JSON.stringify(commandObj));
        this._apiCall(this.apiHost + `/v1.0/infrareds/${deviceId}/air-conditioners/${remoteId}/command`, "POST", commandObj, (_body, err) => {
            var body = {success: false, msg: "Failed to invoke API"};
            if (!err) {
                body = JSON.parse(_body);
            }
            cb(body);
        })
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

    _calculateSign(withAccessToken: boolean) {
        this.timestamp = new Date().getTime();
        var str = withAccessToken ? this.clientId + this.accessToken + this.timestamp : this.clientId + this.timestamp
        this.signKey = CryptoJS.HmacSHA256(str, this.clientSecret).toString().toUpperCase();
    }

    _loginApiCall(endpoint: string, body: object, cb) {
        var _this = this;
        this._calculateSign(false);
        var options = {
            url: endpoint,
            headers: {
                'client_id': this.clientId,
                'sign': this.signKey,
                't': this.timestamp,
                'sign_method': 'HMAC-SHA256'
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
        this._calculateSign(true);
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
            cb(body, error);
        })
            .on('error', (err) => {
                _this.log.error("API call failed.");
                _this.log.error(err);
            })
    }
}