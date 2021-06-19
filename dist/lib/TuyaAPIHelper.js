"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuyaAPIHelper = void 0;
const CryptoJS = require('crypto-js');
const request = require('request');
class TuyaAPIHelper {
    constructor(config, log) {
        this.accessToken = "";
        this.refreshToken = "";
        this.clientId = "";
        this.clientSecret = "";
        this.apiHost = "";
        this.timestamp = new Date().getTime();
        this.signKey = "";
        this.clientId = config.client_id;
        this.clientSecret = config.secret;
        this.apiHost = `https://openapi.tuya${config.region}.com`;
        this.log = log;
        this.config = config;
    }
    static Instance(config, log) {
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
                }, (body.result.expire_time - 5) * 1000);
            }
            cb();
        });
    }
    fetchDevices(deviceId, cb) {
        this._apiCall(this.apiHost + `/v1.0/infrareds/${deviceId}/remotes`, "GET", {}, (_body) => {
            var body = JSON.parse(_body);
            var devs = [];
            if (body.result.length == 0) {
                this.log.warn("API didn't return any devices Using hardcoded devices...");
                for (var i = 0; i < this.config.devices.length; i++) {
                    this._apiCall(this.apiHost + `/v1.0/devices/${this.config.devices[i].remoteId}`, "GET", {}, (_b) => {
                        devs.push(JSON.parse(_b).result);
                        if (devs.length == this.config.devices.length) {
                            cb(devs);
                        }
                    });
                }
            }
            else {
                this.log.warn(`API returned ${body.result.length} remotes...`);
                for (var i = 0; i < body.result.length; i++) {
                    this._apiCall(this.apiHost + `/v1.0/devices/${body.result[i].remote_id}`, "GET", {}, (_b) => {
                        devs.push(JSON.parse(_b).result);
                        if (devs.length == body.result.length) {
                            cb(devs);
                        }
                    });
                }
            }
        });
    }
    sendACCommand(deviceId, remoteId, command, value, cb) {
        let commandObj = {
            "code": command,
            "value": value
        };
        this.log.debug(JSON.stringify(commandObj));
        this._apiCall(this.apiHost + `/v1.0/infrareds/${deviceId}/air-conditioners/${remoteId}/command`, "POST", commandObj, (_body) => {
            var body = JSON.parse(_body);
            cb(body);
        });
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
            }
            else {
                _this.log.error(`Unable to refresh token: ${body.msg}`);
            }
        });
    }
    _calculateSign() {
        this.timestamp = new Date().getTime();
        var str = this.clientId + this.accessToken + this.timestamp;
        this.signKey = CryptoJS.HmacSHA256(str, this.clientSecret).toString().toUpperCase();
    }
    _loginApiCall(endpoint, body, cb) {
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
            _this.log.debug("API call successful.");
            cb(body);
        })
            .on('error', (err) => {
            _this.log.error("API call failed.");
            _this.log.error(err);
        });
    }
    _apiCall(endpoint, method, body, cb) {
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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        };
        request(options, function (error, response, body) {
            // body is the decompressed response body
            _this.log.debug("API call successful.");
            cb(body);
        })
            .on('error', (err) => {
            _this.log.error("API call failed.");
            _this.log.error(err);
        });
    }
}
exports.TuyaAPIHelper = TuyaAPIHelper;
//# sourceMappingURL=TuyaAPIHelper.js.map