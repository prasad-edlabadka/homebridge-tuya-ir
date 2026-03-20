"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginHelper = void 0;
const https_1 = __importDefault(require("https"));
const url_1 = require("url");
const APIInvocationHelper_1 = require("./APIInvocationHelper");
const BaseHelper_1 = require("./BaseHelper");
class LoginHelper extends BaseHelper_1.BaseHelper {
    constructor(config, log) {
        super(config, log);
        this.accessToken = "";
        this.refreshToken = "";
        // Exponential backoff state for login/refresh retries.
        this.retryCount = 0;
        // Guard against concurrent refresh attempts (e.g. multiple API callers
        // all detecting "token invalid" at once).
        this.refreshInProgress = null;
        // Handle for the proactive refresh timer so we can cancel/reset it.
        this.refreshTimer = null;
    }
    static Instance(config, log) {
        // IMPORTANT: multiple smartIR entries create multiple TuyaIRConfiguration objects.
        // LoginHelper is a singleton; refresh/login must not use stale config/log/region.
        if (this._instance) {
            this._instance.config = config;
            this._instance.log = log;
            this._instance.apiHost = `https://openapi.tuya${config.deviceRegion}.com`;
            return this._instance;
        }
        return (this._instance = new this(config, log));
    }
    getAccessToken() {
        return this.accessToken;
    }
    login() {
        return new Promise((resolve, reject) => {
            const LOGIN_URI = "/v1.0/token?grant_type=1";
            this.log.debug(`Logging in to the the server ${this.apiHost}...`);
            this.invokeTuyaLoginAPI(this.apiHost + LOGIN_URI, (body) => {
                if (body.success) {
                    this.extractAccessTokenFromAPIResponse(body);
                    this.scheduleProactiveRefresh(body.result.expire_time);
                    this.retryCount = 0; // reset backoff on success
                    this.log.info(`Login successful.`);
                    resolve();
                }
                else {
                    this.handleLoginError(body.msg);
                    reject(new Error(body.msg));
                }
            });
        });
    }
    invokeTuyaLoginAPI(endpoint, callback) {
        const timestamp = new Date().getTime();
        const signedParameters = APIInvocationHelper_1.APIInvocationHelper.getSignedValuesForGetWithoutAccessToken(new url_1.URL(endpoint), this.config, timestamp);
        const options = {
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
        https_1.default.get(endpoint, options, (incomingMsg) => {
            let body = '';
            incomingMsg.on('data', (chunk) => {
                body += chunk;
            });
            incomingMsg.on('end', () => {
                this.log.debug(body);
                if (incomingMsg.statusCode != 200) {
                    this.log.error("Api call failed with response code " + incomingMsg.statusCode);
                    callback({ success: false, msg: `HTTP ${incomingMsg.statusCode}` });
                }
                else {
                    let jsonBody;
                    try {
                        jsonBody = JSON.parse(body);
                    }
                    catch (error) {
                        jsonBody = { success: false, msg: `Unable to parse body because '${error}'` };
                    }
                    this.log.debug("API call successful.");
                    callback(jsonBody);
                }
            });
        }).on('error', (err) => {
            this.log.error("Login/refresh API call failed due to network error.");
            this.log.error(err.message, err.stack);
            // Surface the error to the caller so it can retry with backoff.
            callback({ success: false, msg: `Network error: ${err.message}` });
        });
    }
    /**
     * Refresh the access token. Returns a Promise so callers can await it.
     * Multiple concurrent callers share the same in-flight request.
     */
    refreshAccessToken() {
        if (this.refreshInProgress) {
            this.log.debug("Token refresh already in progress, awaiting existing request...");
            return this.refreshInProgress;
        }
        this.refreshInProgress = this.doRefresh().finally(() => {
            this.refreshInProgress = null;
        });
        return this.refreshInProgress;
    }
    doRefresh() {
        return new Promise((resolve, reject) => {
            this.log.info("Need to refresh token now...");
            this.invokeTuyaLoginAPI(this.apiHost + "/v1.0/token/" + this.refreshToken, (body) => {
                if (body.success) {
                    this.extractAccessTokenFromAPIResponse(body);
                    this.scheduleProactiveRefresh(body.result.expire_time);
                    this.retryCount = 0; // reset backoff on success
                    this.log.info(`Token refreshed successfully. Next refresh after ${body.result.expire_time} seconds`);
                    resolve();
                }
                else {
                    this.log.error(`Unable to refresh token: ${body.msg}. Trying fresh login...`);
                    this.login().then(resolve, reject);
                }
            });
        });
    }
    /**
     * Schedule the proactive (timer-based) token refresh that fires before
     * the token expires. Cancels any previously scheduled refresh.
     */
    scheduleProactiveRefresh(refreshInterval) {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.refreshTimer = setTimeout(() => {
            this.refreshAccessToken();
        }, (refreshInterval - 5) * 1000);
    }
    extractAccessTokenFromAPIResponse(responseBody) {
        this.accessToken = responseBody.result.access_token;
        this.refreshToken = responseBody.result.refresh_token;
    }
    /**
     * Retry login with exponential backoff: 30 s → 60 s → 120 s → ... up to 5 min.
     */
    handleLoginError(errorMessage) {
        const delayMs = Math.min(LoginHelper.BASE_RETRY_MS * Math.pow(2, this.retryCount), LoginHelper.MAX_RETRY_MS);
        this.retryCount++;
        this.log.error(`Failed to login due to error '${errorMessage}'. ` +
            `Retry ${this.retryCount} in ${Math.round(delayMs / 1000)}s...`);
        setTimeout(() => {
            this.login();
        }, delayMs);
    }
}
exports.LoginHelper = LoginHelper;
LoginHelper.BASE_RETRY_MS = 30000; // 30 s
LoginHelper.MAX_RETRY_MS = 300000; // 5 min
//# sourceMappingURL=LoginHelper.js.map