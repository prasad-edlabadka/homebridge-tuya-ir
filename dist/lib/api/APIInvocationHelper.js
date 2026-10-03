"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIInvocationHelper = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const https_1 = __importDefault(require("https"));
const url_1 = require("url");
const LoginHelper_1 = require("./LoginHelper");
class APIInvocationHelper {
    static getSignedValuesForGetWithAccessToken(url, config, timestamp, accessToken) {
        return this.calculateSign(url, config, "GET", timestamp, true, accessToken);
    }
    static getSignedValuesForGetWithoutAccessToken(url, config, timestamp) {
        return this.calculateSign(url, config, "GET", timestamp, false);
    }
    static invokeTuyaIrApi(log, config, endpoint, method, body, callback, hasSwitched = false) {
        log.debug(`Calling endpoint ${endpoint} with payload ${JSON.stringify(body)}`);
        const loginHelper = LoginHelper_1.LoginHelper.Instance(config, log);
        const invokeWithToken = () => {
            const timestamp = new Date().getTime();
            const accessToken = loginHelper.getAccessToken();
            const emptyBodyForGet = method === "GET" ? "" : JSON.stringify(body);
            const signedParameters = this.calculateSign(new url_1.URL(endpoint), config, method, timestamp, true, accessToken, emptyBodyForGet);
            const options = {
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
            const req = https_1.default.request(endpoint, options, (incomingMsg) => {
                let responseBody = '';
                incomingMsg.on('data', (chunk) => {
                    responseBody += chunk;
                });
                incomingMsg.on('end', () => {
                    var _a;
                    let jsonBody;
                    try {
                        jsonBody = JSON.parse(responseBody);
                    }
                    catch (error) {
                        jsonBody = {
                            msg: `Unable to parse body because '${error}'`
                        };
                    }
                    if (this.isQuotaError((_a = incomingMsg.statusCode) !== null && _a !== void 0 ? _a : 0, jsonBody)) {
                        if (!hasSwitched && config.switchToNextProject()) {
                            log.warn(`Tuya API quota/rate limit reached. Switching to project ${config.activeProjectIndex + 1} and retrying.`);
                            this.invokeTuyaIrApi(log, config, endpoint, method, body, callback, true);
                            return;
                        }
                        log.error(`Tuya API quota/rate limit reached and no alternate project is available.`);
                        callback(jsonBody);
                        return;
                    }
                    if (incomingMsg.statusCode != 200) {
                        log.error("Api call failed with response code " +
                            incomingMsg.statusCode);
                        callback(jsonBody);
                    }
                    else {
                        log.debug("API call successful.", responseBody);
                        callback(jsonBody);
                    }
                });
            }).on('error', (err) => {
                log.error(err.message, err.stack);
                callback({
                    msg: `Failed to invoke API '${err.message}'`
                });
            });
            if (method != "GET")
                req.write(JSON.stringify(body));
            req.end();
        };
        if (!loginHelper.getAccessToken()) {
            loginHelper.login()
                .then(() => invokeWithToken())
                .catch((error) => {
                callback({
                    msg: `Failed to login to Tuya API '${error}'`
                });
            });
        }
        else {
            invokeWithToken();
        }
    }
    static isQuotaError(statusCode, responseBody) {
        var _a;
        if (statusCode === 429) {
            return true;
        }
        const message = String((responseBody === null || responseBody === void 0 ? void 0 : responseBody.msg) ||
            (responseBody === null || responseBody === void 0 ? void 0 : responseBody.message) ||
            ((_a = responseBody === null || responseBody === void 0 ? void 0 : responseBody.result) === null || _a === void 0 ? void 0 : _a.msg) ||
            "").toLowerCase();
        return (message.includes("quota") ||
            message.includes("rate limit") ||
            message.includes("frequency limit") ||
            message.includes("traffic limit") ||
            message.includes("request limit") ||
            message.includes("api limit") ||
            message.includes("too many requests"));
    }
    static calculateSign(url, config, httpMethod, timestamp, withAccessToken, accessToken = "", body = "") {
        const returnObject = {
            timestamp: timestamp,
            signKey: ""
        };
        const signedParameters = this.stringToSign(url.search, url.pathname, httpMethod, body);
        const signStr = signedParameters.signedUrl;
        const str = withAccessToken
            ? config.tuyaAPIClientId + accessToken + timestamp + signStr
            : config.tuyaAPIClientId + timestamp + signStr;
        returnObject.signKey = crypto_js_1.default.HmacSHA256(str, config.tuyaAPISecret).toString().toUpperCase();
        return returnObject;
    }
    static stringToSign(query, url, method, body = "") {
        const sha256 = crypto_js_1.default.SHA256(body);
        return {
            signedUrl: method + "\n" + sha256 + "\n\n" + url + query,
            url: url + query
        };
    }
}
exports.APIInvocationHelper = APIInvocationHelper;
//# sourceMappingURL=APIInvocationHelper.js.map