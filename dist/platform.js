"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuyaIRPlatform = void 0;
const TuyaIRDiscovery_1 = require("./lib/TuyaIRDiscovery");
const AirConditionerAccessory_1 = require("./lib/AirConditionerAccessory");
const PLATFORM_NAME = 'TuyaIR';
const PLUGIN_NAME = 'homebridge-tuya-ir';
const CLASS_DEF = {
    infrared_ac: AirConditionerAccessory_1.AirConditionerAccessory
};
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
class TuyaIRPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        // this is used to track restored cached accessories
        this.accessories = [];
        this.cachedAccessories = new Map();
        this.log.debug('Finished initializing platform:', this.config.name);
        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', () => {
            log.debug('Executed didFinishLaunching callback');
            // run the method to discover / register your devices as accessories
            this.discoverDevices();
        });
    }
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
    }
    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    discoverDevices() {
        const devices = {};
        if (!this.config.devices)
            return this.log.error("No devices configured. Please configure atleast one device.");
        if (!this.config.client_id)
            return this.log.error("Client ID is not configured. Please check your config.json");
        if (!this.config.secret)
            return this.log.error("Client Secret is not configured. Please check your config.json");
        if (!this.config.region)
            return this.log.error("Region is not configured. Please check your config.json");
        if (!this.config.deviceId)
            return this.log.error("IR Blaster device ID is not configured. Please check your config.json");
        this.log.info('Starting discovery...');
        var tuya = new TuyaIRDiscovery_1.TuyaIRDiscovery(this.log, this.api);
        tuya.start(this.api, this.config, (devices) => {
            //loop over the discovered devices and register each one if it has not already been registered
            for (var device of devices) {
                // generate a unique id for the accessory this should be generated from
                // something globally unique, but constant, for example, the device serial
                // number or MAC address
                device.ir_id = this.config.deviceId;
                const Accessory = CLASS_DEF[device.category];
                const uuid = this.api.hap.uuid.generate(device.id);
                // see if an accessory with the same uuid has already been registered and restored from
                // the cached devices we stored in the `configureAccessory` method above
                const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
                if (existingAccessory) {
                    // the accessory already exists
                    this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                    // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                    // existingAccessory.context.device = device;
                    // this.api.updatePlatformAccessories([existingAccessory]);
                    // create the accessory handler for the restored accessory
                    // this is imported from `platformAccessory.ts`
                    if (Accessory) {
                        new Accessory(this, existingAccessory);
                    }
                    else {
                        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
                        this.log.warn(`Removing unsupported accessory '${existingAccessory.displayName}'...`);
                    }
                    // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                    // remove platform accessories when no longer present
                    // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
                    // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
                }
                else {
                    if (Accessory) {
                        // the accessory does not yet exist, so we need to create it
                        this.log.info('Adding new accessory:', device.name);
                        // create a new accessory
                        const accessory = new this.api.platformAccessory(device.name, uuid);
                        // store a copy of the device object in the `accessory.context`
                        // the `context` property can be used to store any data about the accessory you may need
                        accessory.context.device = device;
                        // create the accessory handler for the newly create accessory
                        // this is imported from `platformAccessory.ts`
                        new Accessory(this, accessory);
                        // link the accessory to your platform
                        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                    }
                    else {
                        this.log.warn(`Unsupported accessory '${device.name}'...`);
                    }
                }
            }
        });
    }
}
exports.TuyaIRPlatform = TuyaIRPlatform;
//# sourceMappingURL=platform.js.map