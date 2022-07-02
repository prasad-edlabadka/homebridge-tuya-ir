import { Logger } from "homebridge";
import { TuyaIRConfiguration } from "../model/TuyaIRConfiguration";
import { BaseHelper } from "./BaseHelper";
export declare class LoginHelper extends BaseHelper {
    private static _instance;
    private accessToken;
    private refreshToken;
    private constructor();
    static Instance(config: TuyaIRConfiguration, log: Logger): LoginHelper;
    getAccessToken(): string;
    login(): Promise<unknown>;
    private invokeTuyaLoginAPI;
    refreshAccessToken(): void;
    private configureNextAccessTokenRefresh;
    private extractAccessTokenFromAPIResponse;
    private handleLoginError;
}
//# sourceMappingURL=LoginHelper.d.ts.map