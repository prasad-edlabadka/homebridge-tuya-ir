/// <reference types="node" />
import { Logger } from 'homebridge';
import { URL } from 'url';
import { TuyaIRConfiguration } from '../model/TuyaIRConfiguration';
export declare class APIInvocationHelper {
    static getSignedValuesForGetWithAccessToken(url: URL, config: TuyaIRConfiguration, timestamp: number, accessToken: string): {
        timestamp: number;
        signKey: string;
    };
    static getSignedValuesForGetWithoutAccessToken(url: URL, config: TuyaIRConfiguration, timestamp: number): {
        timestamp: number;
        signKey: string;
    };
    static invokeTuyaIrApi(log: Logger, config: TuyaIRConfiguration, endpoint: string, method: string, body: object, callback: any): void;
    private static calculateSign;
    private static stringToSign;
    /**
     * Tuya error codes that indicate an invalid/expired access token.
     * 1010 = token invalid, 1011 = token expired, 1012 = token does not exist.
     */
    private static readonly TOKEN_ERROR_CODES;
    private static isTokenError;
}
//# sourceMappingURL=APIInvocationHelper.d.ts.map