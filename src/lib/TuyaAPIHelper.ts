import { Logger } from "homebridge";
import { Config } from "./Config";

const CryptoJS = require('crypto-js');
const request = require('request');

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
        var _this = this;
        this.log.info(`Logging in to the the server ${this.apiHost}...`);
        this._loginApiCall(this.apiHost + "/v1.0/token?grant_type=1", {}, (_body) => {
            var body = JSON.parse(_body);
            if (body.success) {

                _this.accessToken = body.result.access_token;
                _this.refreshToken = body.result.refresh_token;
                setTimeout(() => {
                    this._refreshToken();
                }, body.result.expire_time * 1000);
            }
            cb();
        });
    }

    fetchDevices(deviceId: string, cb) {
        this._apiCall(this.apiHost + `/v1.0/infrareds/${deviceId}/remotes`, "GET", {}, (_body) => {
            var body = JSON.parse(_body);
            if (body.result.length == 0) {
                this.log.warn("API didn't return any devices Using hardcoded devices...");
                var devs: any[] = [];
                for (var i = 0; i < this.config.devices.length; i++) {
                    this._apiCall(this.apiHost + `/v1.0/devices/${this.config.devices[i].remoteId}`, "GET", {}, (_b) => {
                        devs.push(JSON.parse(_b).result);
                        if (devs.length == this.config.devices.length) {
                            cb(devs);
                        }
                    });
                }
            } else {
                //Do something when API returns
                cb([]);
            }
        })
    }

    sendACCommand(deviceId: string, remoteId: string, command: string, value: string|number, cb) {
        let commandObj = {
            "code": command,
            "value": value
        }
        this.log.debug(JSON.stringify(commandObj));
        this._apiCall(this.apiHost + `/v1.0/infrareds/${deviceId}/air-conditioners/${remoteId}/command`, "POST", commandObj, (_body) => {
            var body = JSON.parse(_body);
            cb(body);
        })
    }


    _refreshToken() {
        this.log.warn("Need to refresh token now...")
    }

    _calculateSign() {
        this.timestamp = new Date().getTime();
        var str = this.clientId + this.accessToken + this.timestamp;
        this.signKey = CryptoJS.HmacSHA256(str, this.clientSecret).toString().toUpperCase();
    }

    _loginApiCall(endpoint: string, body: object, cb) {
        var _this = this;
        this._calculateSign();
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
            // body is the decompressed response body
            //console.log('server encoded the data as: ' + (response.headers['content-encoding'] || 'identity'))
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
        this._calculateSign();
        var options = {
            method: method,
            url: endpoint,
            headers: {
                'client_id': this.clientId,
                'sign': this.signKey,
                't': this.timestamp,
                'access_token': this.accessToken,
                'sign_method': 'HMAC-SHA256',
                'Content-Type':'application/json'
            },
            body: JSON.stringify(body)
        };
        request(options, function (error, response, body) {
            // body is the decompressed response body
            //console.log('server encoded the data as: ' + (response.headers['content-encoding'] || 'identity'))
            _this.log.debug("API call successful.");
            cb(body);
        })
            .on('error', (err) => {
                _this.log.error("API call failed.");
                _this.log.error(err);
            })
    }
}