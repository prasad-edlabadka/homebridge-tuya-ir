import { Logger } from "homebridge";
import { Config } from "./Config";
export declare class TuyaAPIHelper {
    private constructor();
    private accessToken;
    private refreshToken;
    private clientId;
    private clientSecret;
    private apiHost;
    private timestamp;
    private signKey;
    private log;
    private config;
    private static _instance;
    static Instance(config: Config, log: Logger): TuyaAPIHelper;
    login(cb: any): void;
    fetchDevices(deviceId: string, cb: any): void;
    _manualFetch(cb: any): void;
    sendACCommand(deviceId: string, remoteId: string, command: string, value: string | number, cb: any): void;
    getACStatus(deviceId: string, remoteId: string, cb: any): void;
    sendFanCommand(deviceId: string, remoteId: string, command: string | number, diy: boolean | undefined, cb: any): void;
    getFanCommands(deviceId: string, remoteId: string, diy: boolean | undefined, cb: any): void;
    _refreshToken(): void;
    _calculateSign(withAccessToken: boolean, query: string, url: string, httpMethod: string, body?: string): void;
    _loginApiCall(endpoint: string, body: object, cb: any): void;
    _apiCall(endpoint: string, method: string, body: object, cb: any): void;
    _stringToSign(query: any, url: any, method: any, body: any): {};
    toJsonObj(params: any, arr: any, map: any): void;
}
//# sourceMappingURL=TuyaAPIHelper.d.ts.map