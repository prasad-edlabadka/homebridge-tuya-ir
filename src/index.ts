import { API } from 'homebridge';

import { TuyaIRPlatform } from './platform';
const PLATFORM_NAME = 'TuyaIR';
/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, TuyaIRPlatform);
};
