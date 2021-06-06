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
    sendACCommand(deviceId: string, remoteId: string, command: string, value: string | number, cb: any): void;
    _refreshToken(): void;
    _calculateSign(): void;
    _loginApiCall(endpoint: string, body: object, cb: any): void;
    _apiCall(endpoint: string, method: string, body: object, cb: any): void;
}
//# sourceMappingURL=TuyaAPIHelper.d.ts.map