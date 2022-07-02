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
    }
    static Instance(config, log) {
        return this._instance || (this._instance = new this(config, log));
    }
    getAccessToken() {
        return this.accessToken;
    }
    login() {
        return new Promise((resolve, reject) => {
            const LOGIN_URI = "/v1.0/token?grant_type=1";
            this.log.info(`Logging in to the the server ${this.apiHost}...`);
            this.invokeTuyaLoginAPI(this.apiHost + LOGIN_URI, (body) => {
                if (body.success) {
                    this.extractAccessTokenFromAPIResponse(body);
                    this.configureNextAccessTokenRefresh(body.result.expire_time);
                    this.log.info(`Login successful.`);
                    resolve('');
                }
                else {
                    this.handleLoginError(body.msg);
                    reject(body.msg);
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
        this.log.info(JSON.stringify(options));
        https_1.default.get(endpoint, options, (incomingMsg) => {
            let body = '';
            incomingMsg.on('data', (chunk) => {
                body += chunk;
            });
            incomingMsg.on('end', () => {
                this.log.info(body);
                if (incomingMsg.statusCode != 200) {
                    this.log.error("Api call failed with response code " + incomingMsg.statusCode);
                }
                else {
                    let jsonBody;
                    try {
                        jsonBody = JSON.parse(body);
                    }
                    catch (error) {
                        jsonBody = { msg: `Unable to parse body because '${error}'` };
                    }
                    this.log.debug("API call successful.");
                    callback(jsonBody);
                }
            });
        }).on('error', (err) => {
            this.log.error("API call failed.");
            this.log.error(err.message, err.stack);
        });
    }
    refreshAccessToken() {
        this.log.info("Need to refresh token now...");
        this.invokeTuyaLoginAPI(this.apiHost + "/v1.0/token/" + this.refreshToken, (body) => {
            if (body.success) {
                this.extractAccessTokenFromAPIResponse(body);
                this.configureNextAccessTokenRefresh(body.result.expire_time);
                this.log.info(`Token refreshed successfully. Next refresh after ${body.result.expire_time} seconds`);
            }
            else {
                this.log.error(`Unable to refresh token: ${body.msg}. Trying fresh login...`);
                this.login();
            }
        });
    }
    configureNextAccessTokenRefresh(refreshInterval) {
        setTimeout(() => {
            this.refreshAccessToken();
        }, (refreshInterval - 5) * 1000);
    }
    extractAccessTokenFromAPIResponse(responseBody) {
        this.accessToken = responseBody.result.access_token;
        this.refreshToken = responseBody.result.refresh_token;
    }
    handleLoginError(errorMessage) {
        this.log.error(`Failed to login due to error '${errorMessage}'. Retying after 1 minute...`);
        setTimeout(() => {
            this.login();
        }, 60000);
    }
}
exports.LoginHelper = LoginHelper;
//# sourceMappingURL=LoginHelper.js.map