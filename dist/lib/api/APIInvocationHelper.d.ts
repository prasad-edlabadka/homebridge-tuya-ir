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
    static invokeTuyaIrApi(log: Logger, config: TuyaIRConfiguration, endpoint: string, method: string, body: object, callback: any, hasSwitched?: boolean): void;
    private static isQuotaError;
    private static calculateSign;
    private static stringToSign;
}
//# sourceMappingURL=APIInvocationHelper.d.ts.map