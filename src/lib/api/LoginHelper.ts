import { Logger } from "homebridge";
import request from "https";
import { URL } from "url";
import { TuyaIRConfiguration } from "../model/TuyaIRConfiguration";
import { APIInvocationHelper } from "./APIInvocationHelper";
import { BaseHelper } from "./BaseHelper";

export class LoginHelper extends BaseHelper {
    private static _instance: LoginHelper;
    private accessToken = "";
    private refreshToken = "";

    private constructor(config: TuyaIRConfiguration, log: Logger) {
        super(config, log);
    }

    public static Instance(config: TuyaIRConfiguration, log: Logger) {
        return this._instance || (this._instance = new this(config, log));
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
                    this.configureNextAccessTokenRefresh(body.result.expire_time);
                    this.log.info(`Login successful.`);
                    resolve('');
                } else {
                    this.handleLoginError(body.msg);
                    reject(body.msg);
                }
            });
        })

    }

    private invokeTuyaLoginAPI(endpoint: string, callback) {
        const timestamp = new Date().getTime();
        const signedParameters = APIInvocationHelper.getSignedValuesForGetWithoutAccessToken(new URL(endpoint), this.config, timestamp);
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

        this.log.debug(JSON.stringify(options))

        request.get(endpoint, options, (incomingMsg) => {
            let body = '';
            incomingMsg.on('data', (chunk) => {
                body += chunk;
            });

            incomingMsg.on('end', () => {
                this.log.debug(body);
                if (incomingMsg.statusCode != 200) {
                    this.log.error("Api call failed with response code " + incomingMsg.statusCode);
                } else {
                    let jsonBody;
                    try {
                        jsonBody = JSON.parse(body);
                    } catch (error) {
                        jsonBody = { msg: `Unable to parse body because '${error}'` };
                    }
                    this.log.debug("API call successful.");
                    callback(jsonBody);
                }
            });
        }).on('error', (err) => {
            this.log.error("API call failed.");
            this.log.error(err.message, err.stack);
        })
    }

    refreshAccessToken() {
        this.log.info("Need to refresh token now...");
        this.invokeTuyaLoginAPI(this.apiHost + "/v1.0/token/" + this.refreshToken, (body) => {
            if (body.success) {
                this.extractAccessTokenFromAPIResponse(body);
                this.configureNextAccessTokenRefresh(body.result.expire_time);
                this.log.info(`Token refreshed successfully. Next refresh after ${body.result.expire_time} seconds`);
            } else {
                this.log.error(`Unable to refresh token: ${body.msg}. Trying fresh login...`);
                this.login();
            }
        });
    }

    private configureNextAccessTokenRefresh(refreshInterval: number) {
        setTimeout(() => {
            this.refreshAccessToken();
        }, (refreshInterval - 5) * 1000);
    }

    private extractAccessTokenFromAPIResponse(responseBody) {
        this.accessToken = responseBody.result.access_token;
        this.refreshToken = responseBody.result.refresh_token;
    }

    private handleLoginError(errorMessage) {
        this.log.error(`Failed to login due to error '${errorMessage}'. Retying after 1 minute...`);
        setTimeout(() => {
            this.login();
        }, 60000);
    }


}