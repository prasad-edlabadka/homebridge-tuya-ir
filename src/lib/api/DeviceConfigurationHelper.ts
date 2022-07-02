import { Logger } from "homebridge";
import { TuyaIRConfiguration } from "../model/TuyaIRConfiguration";
import { APIInvocationHelper } from "./APIInvocationHelper";
import { BaseHelper } from "./BaseHelper";

export class DeviceConfigurationHelper extends BaseHelper {

    private static _instance: DeviceConfigurationHelper;

    private constructor(config: TuyaIRConfiguration, log: Logger) {
        super(config, log);
    }

    public static Instance(config: TuyaIRConfiguration, log: Logger) {
        return this._instance || (this._instance = new this(config, log));
    }

    fetchDevices(deviceId: string) {
        return new Promise((resolve) => {
            this.log.debug(`This is the config: ${JSON.stringify(this.config)}`);
            if (!this.config.autoFetchRemotesFromServer) {
                this.log.info("Auto discovery of remotes disabled...");
                this.manualFetch(resolve);
            } else {
                this.log.info("Auto discovery of remotes enabled. Fetching with API...");
                this.autoFetch(deviceId, resolve);
            }
        });
    }

    private manualFetch(cb) {
        const devs: unknown[] = [];
        for (let i = 0; i < this.config.configuredRemotes.length; i++) {
            const dev = this.config.configuredRemotes[i];
            this.fetchRemoteDetails(dev.id, (device) => {
                device.config = this.config;
                devs.push(device);
                if (devs.length == this.config.configuredRemotes.length) {
                    cb(devs);
                }
            });
        }
    }

    private autoFetch(deviceId, cb) {
        APIInvocationHelper.invokeTuyaIrApi(this.log, this.config, `${this.apiHost}/v1.0/infrareds/${deviceId}/remotes`, "GET", {}, (body) => {
            const devs: unknown[] = [];
            if (body.success && body.result) {
                this.log.info(`API returned ${body.result.length} remotes...`);
                for (let i = 0; i < body.result.length; i++) {
                    this.fetchRemoteDetails(body.result[i].remote_id, (device) => {
                        device.config = this.config;
                        devs.push(device);
                        if (devs.length == body.result.length) {
                            cb(devs);
                        }
                    })
                }
            } else {
                this.log.warn("API didn't return any devices Using hardcoded devices...");
                this.manualFetch(cb);
            }
        })
    }

    private fetchRemoteDetails(id, callback) {
        this.log.warn(this.apiHost + `/v1.0/devices/${id}`);
        APIInvocationHelper.invokeTuyaIrApi(this.log, this.config, this.apiHost + `/v1.0/devices/${id}`, "GET", {}, (body) => {
            if (body.success) {
                callback(body.result);
            } else {
                this.log.error("Failed to get remote configuration for: " + id);
                this.log.error(`Server returned error: '${body.msg}'`);
                callback({});
            }
        });
    }
}