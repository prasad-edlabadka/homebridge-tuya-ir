import EventEmitter from 'events';
import { Logger, PlatformConfig } from 'homebridge';
import { TuyaIRConfiguration } from './model/TuyaIRConfiguration';
import { LoginHelper } from './api/LoginHelper';
import { DeviceConfigurationHelper } from './api/DeviceConfigurationHelper';

export class TuyaIRDiscovery extends EventEmitter {
    private platformConfig: PlatformConfig;

    constructor(private readonly log: Logger, platformConfig: PlatformConfig) {
        super();
        this.platformConfig = platformConfig;
    }

    startDiscovery(index, cb) {
        this.log.info(`Trying to login...`);
        const configuration = new TuyaIRConfiguration(this.platformConfig, index);
        const loginHelper = LoginHelper.Instance(configuration, this.log);
        const deviceConfigHelper = DeviceConfigurationHelper.Instance(configuration, this.log);
        loginHelper.login()
            .then(() => {
                this.log.info("Fetching configured remotes...");
                return deviceConfigHelper.fetchDevices(configuration.irDeviceId);
            }).then((devs) => {
                cb(devs, index);
            }).catch(error => {
                this.log.error("Failed because of " + error);
            });
    }
}