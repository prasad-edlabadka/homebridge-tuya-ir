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
    static invokeTuyaIrApi(log, config, endpoint, method, body, callback) {
        log.debug(`Calling endpoint ${endpoint}`);
        const timestamp = new Date().getTime();
        const accessToken = LoginHelper_1.LoginHelper.Instance(config, log).getAccessToken();
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
            let body = '';
            incomingMsg.on('data', (chunk) => {
                body += chunk;
            });
            incomingMsg.on('end', () => {
                if (incomingMsg.statusCode != 200) {
                    log.error("Api call failed with response code " + incomingMsg.statusCode);
                }
                else {
                    let jsonBody;
                    try {
                        jsonBody = JSON.parse(body);
                    }
                    catch (error) {
                        jsonBody = { msg: `Unable to parse body because '${error}'` };
                    }
                    log.debug("API call successful.", body);
                    callback(jsonBody);
                }
            });
        }).on('error', (err) => {
            log.error(err.message, err.stack);
            callback({ msg: `Failed to invoke API '${err.message}'` });
        });
        req.write(JSON.stringify(body));
        req.end();
    }
    static calculateSign(url, config, httpMethod, timestamp, withAccessToken, accessToken = "", body = "") {
        const returnObject = { timestamp: timestamp, signKey: "" };
        const signedParameters = this.stringToSign(url.search, url.pathname, httpMethod, body);
        const signStr = signedParameters.signedUrl;
        const str = withAccessToken ? config.tuyaAPIClientId + accessToken + timestamp + signStr : config.tuyaAPIClientId + timestamp + signStr;
        returnObject.signKey = crypto_js_1.default.HmacSHA256(str, config.tuyaAPISecret).toString().toUpperCase();
        return returnObject;
    }
    static stringToSign(query, url, method, body = "") {
        const sha256 = crypto_js_1.default.SHA256(body);
        return { signedUrl: method + "\n" + sha256 + "\n\n" + url + query, url: url + query };
    }
}
exports.APIInvocationHelper = APIInvocationHelper;
//# sourceMappingURL=APIInvocationHelper.js.map