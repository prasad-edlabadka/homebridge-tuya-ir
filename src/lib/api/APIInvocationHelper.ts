import CryptoJS from 'crypto-js';
import { Logger } from 'homebridge';
import request from "https";
import { URL } from 'url';
import { TuyaIRConfiguration } from '../model/TuyaIRConfiguration';
import { LoginHelper } from './LoginHelper';

export class APIInvocationHelper {
    public static getSignedValuesForGetWithAccessToken(url: URL, config: TuyaIRConfiguration, timestamp: number, accessToken: string) {
        return this.calculateSign(url, config, "GET", timestamp, true, accessToken);
    }

    public static getSignedValuesForGetWithoutAccessToken(url: URL, config: TuyaIRConfiguration, timestamp: number) {
        return this.calculateSign(url, config, "GET", timestamp, false);
    }

    public static invokeTuyaIrApi(
        log: Logger,
        config: TuyaIRConfiguration,
        endpoint: string,
        method: string,
        body: object,
        callback,
        hasSwitched = false
    ) {
        log.debug(`Calling endpoint ${endpoint} with payload ${JSON.stringify(body)}`);

        const loginHelper = LoginHelper.Instance(config, log);

        const invokeWithToken = () => {
            const timestamp = new Date().getTime();
            const accessToken = loginHelper.getAccessToken();

            const emptyBodyForGet = method === "GET" ? "" : JSON.stringify(body);

            const signedParameters = this.calculateSign(
                new URL(endpoint),
                config,
                method,
                timestamp,
                true,
                accessToken,
                emptyBodyForGet
            );

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

            const req = request.request(endpoint, options, (incomingMsg) => {
                let responseBody = '';

                incomingMsg.on('data', (chunk) => {
                    responseBody += chunk;
                });

                incomingMsg.on('end', () => {
                    let jsonBody;

                    try {
                        jsonBody = JSON.parse(responseBody);
                    } catch (error) {
                        jsonBody = {
                            msg: `Unable to parse body because '${error}'`
                        };
                    }

                    if (this.isQuotaError(incomingMsg.statusCode ?? 0, jsonBody)) {
                        if (!hasSwitched && config.switchToNextProject()) {
                            log.warn(
                                `Tuya API quota/rate limit reached. Switching to project ${config.activeProjectIndex + 1} and retrying.`
                            );

                            this.invokeTuyaIrApi(
                                log,
                                config,
                                endpoint,
                                method,
                                body,
                                callback,
                                true
                            );
                            return;
                        }

                        log.error(
                            `Tuya API quota/rate limit reached and no alternate project is available.`
                        );
                        callback(jsonBody);
                        return;
                    }

                    if (incomingMsg.statusCode != 200) {
                        log.error(
                            "Api call failed with response code " +
                            incomingMsg.statusCode
                        );
                        callback(jsonBody);
                    } else {
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
        } else {
            invokeWithToken();
        }
    }

    private static isQuotaError(statusCode: number, responseBody: any): boolean {
        if (statusCode === 429) {
            return true;
        }

        const message = String(
            responseBody?.msg ||
            responseBody?.message ||
            responseBody?.result?.msg ||
            ""
        ).toLowerCase();

        return (
            message.includes("quota") ||
            message.includes("rate limit") ||
            message.includes("frequency limit") ||
            message.includes("traffic limit") ||
            message.includes("request limit") ||
            message.includes("api limit") ||
            message.includes("too many requests")
        );
    }

    private static calculateSign(
        url: URL,
        config: TuyaIRConfiguration,
        httpMethod: string,
        timestamp: number,
        withAccessToken: boolean,
        accessToken = "",
        body = ""
    ) {
        const returnObject = {
            timestamp: timestamp,
            signKey: ""
        };

        const signedParameters = this.stringToSign(
            url.search,
            url.pathname,
            httpMethod,
            body
        );

        const signStr = signedParameters.signedUrl;

        const str = withAccessToken
            ? config.tuyaAPIClientId + accessToken + timestamp + signStr
            : config.tuyaAPIClientId + timestamp + signStr;

        returnObject.signKey = CryptoJS.HmacSHA256(
            str,
            config.tuyaAPISecret
        ).toString().toUpperCase();

        return returnObject;
    }

    private static stringToSign(query, url, method, body = "") {
        const sha256 = CryptoJS.SHA256(body);

        return {
            signedUrl: method + "\n" + sha256 + "\n\n" + url + query,
            url: url + query
        };
    }
}
