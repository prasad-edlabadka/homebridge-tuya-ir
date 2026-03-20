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
const tuyaDnsCache_1 = require("./tuyaDnsCache");
// Reuse sockets across requests to reduce DNS/TLS churn.
const tuyaAgent = new https_1.default.Agent({
    keepAlive: true,
    maxSockets: 10,
    maxFreeSockets: 5,
    timeout: 30000,
});
class APIInvocationHelper {
    static getSignedValuesForGetWithAccessToken(url, config, timestamp, accessToken) {
        return this.calculateSign(url, config, 'GET', timestamp, true, accessToken);
    }
    static getSignedValuesForGetWithoutAccessToken(url, config, timestamp) {
        return this.calculateSign(url, config, 'GET', timestamp, false);
    }
    static invokeTuyaIrApi(log, config, endpoint, method, body, callback) {
        log.debug(`Calling endpoint ${endpoint} with payload ${JSON.stringify(body)}`);
        const timestamp = new Date().getTime();
        const accessToken = LoginHelper_1.LoginHelper.Instance(config, log).getAccessToken();
        const bodyForSigning = method === 'GET' ? '' : JSON.stringify(body);
        const signedParameters = this.calculateSign(new url_1.URL(endpoint), config, method, timestamp, true, accessToken, bodyForSigning);
        const options = {
            method,
            headers: {
                client_id: config.tuyaAPIClientId,
                sign: signedParameters.signKey,
                t: timestamp,
                access_token: accessToken,
                sign_method: 'HMAC-SHA256',
                'Content-Type': 'application/json',
            },
            agent: tuyaAgent,
            lookup: tuyaDnsCache_1.cachedLookup,
        };
        const req = https_1.default.request(endpoint, options, (incomingMsg) => {
            let responseBody = '';
            incomingMsg.on('data', (chunk) => {
                responseBody += chunk;
            });
            incomingMsg.on('end', () => {
                let jsonBody;
                try {
                    jsonBody = responseBody ? JSON.parse(responseBody) : {};
                }
                catch (error) {
                    jsonBody = { success: false, msg: `Unable to parse body because '${error}'` };
                }
                if (incomingMsg.statusCode != 200) {
                    log.error(`Api call failed with response code ${incomingMsg.statusCode} for endpoint ${endpoint}`);
                    const msg = (jsonBody === null || jsonBody === void 0 ? void 0 : jsonBody.msg) || `HTTP ${incomingMsg.statusCode}`;
                    callback({ success: false, msg });
                    return;
                }
                // Tuya returns success: false with error codes 1010/1011/1012 when
                // the access token is invalid or expired. Reactively trigger a
                // refresh so we don't wait for the (possibly dead) proactive timer.
                if (!jsonBody.success && this.isTokenError(jsonBody)) {
                    log.warn(`Token invalid (code ${jsonBody.code}), triggering refresh...`);
                    LoginHelper_1.LoginHelper.Instance(config, log).refreshAccessToken().catch((err) => {
                        log.error(`Reactive token refresh failed: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
                    });
                }
                log.debug('API call successful.', responseBody);
                callback(jsonBody);
            });
        });
        req.on('error', (err) => {
            // Flush cached DNS on network errors so next request re-resolves.
            try {
                const host = new url_1.URL(endpoint).hostname;
                const code = err === null || err === void 0 ? void 0 : err.code;
                if (code === 'ETIMEDOUT' ||
                    code === 'ECONNRESET' ||
                    code === 'EPIPE' ||
                    code === 'EHOSTUNREACH' ||
                    code === 'ENETUNREACH' ||
                    code === 'ECONNREFUSED') {
                    tuyaDnsCache_1.flushDnsCache(host);
                }
            }
            catch (_a) {
                // ignore
            }
            const message = (err === null || err === void 0 ? void 0 : err.message) || (err === null || err === void 0 ? void 0 : err.code) || String(err) || 'Unknown error';
            log.error(message, err === null || err === void 0 ? void 0 : err.stack);
            callback({ success: false, msg: `Failed to invoke API '${message}'` });
        });
        if (method !== 'GET') {
            req.write(JSON.stringify(body));
        }
        req.end();
    }
    static calculateSign(url, config, httpMethod, timestamp, withAccessToken, accessToken = '', body = '') {
        const returnObject = { timestamp: timestamp, signKey: '' };
        const signedParameters = this.stringToSign(url.search, url.pathname, httpMethod, body);
        const signStr = signedParameters.signedUrl;
        const str = withAccessToken
            ? config.tuyaAPIClientId + accessToken + timestamp + signStr
            : config.tuyaAPIClientId + timestamp + signStr;
        returnObject.signKey = crypto_js_1.default.HmacSHA256(str, config.tuyaAPISecret).toString().toUpperCase();
        return returnObject;
    }
    static stringToSign(query, url, method, body = '') {
        const sha256 = crypto_js_1.default.SHA256(body);
        return { signedUrl: method + '\n' + sha256 + '\n\n' + url + query, url: url + query };
    }
    static isTokenError(body) {
        return this.TOKEN_ERROR_CODES.has(body === null || body === void 0 ? void 0 : body.code);
    }
}
exports.APIInvocationHelper = APIInvocationHelper;
/**
 * Tuya error codes that indicate an invalid/expired access token.
 * 1010 = token invalid, 1011 = token expired, 1012 = token does not exist.
 */
APIInvocationHelper.TOKEN_ERROR_CODES = new Set([1010, 1011, 1012]);
//# sourceMappingURL=APIInvocationHelper.js.map