
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

# Homebridge Tuya IR
[![npm](https://img.shields.io/npm/v/homebridge-tuya-ir.svg)](https://www.npmjs.com/package/homebridge-tuya-ir)
![GitHub](https://img.shields.io/github/license/prasad-edlabadka/homebridge-tuya-ir)
[![npm](https://img.shields.io/npm/dt/homebridge-tuya-ir.svg)](https://www.npmjs.com/package/homebridge-tuya-ir)
![GitHub issues](https://img.shields.io/github/issues-raw/prasad-edlabadka/homebridge-tuya-ir)
![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/prasad-edlabadka/homebridge-tuya-ir)

![GitHub contributors](https://img.shields.io/github/contributors-anon/prasad-edlabadka/homebridge-tuya-ir)
![GitHub last commit](https://img.shields.io/github/last-commit/prasad-edlabadka/homebridge-tuya-ir)


Control your Tuya IR Blaster baed devices in HomeKit. Also works with Smart Home IR Blaster.

## Supported Devices
* Air Conditioner

## Installation Instructions

#### Option 1: Install via Homebridge Config UI X:

Search for "Tuya IR" in [homebridge-config-ui-x](https://github.com/oznu/homebridge-config-ui-x) and install `homebridge-tuya-ir`.

#### Option 2: Manually Install:

```
sudo npm install -g homebridge-tuya-ir
```

## Configuration
> UI

1. Navigate to the Plugins page in [homebridge-config-ui-x](https://github.com/oznu/homebridge-config-ui-x).
2. Click the **Settings** button for the Tuya IR plugin.
3. Add your devices
4. Add device parameters
5. Restart Homebridge for the changes to take effect.

> Manual

1. Edit the config.json file to add your devices and parameters. 
2. Restart Homebridge

## Known Issues

1. Tuya API doesn't return devices added to IR blaster. Thus, you need to add them in your app and then provide IDs in the plugin configuration. 

## Contributing

If you have new accessory logic for a new device, please add a function defined by manufacturer, and describe your changes in the readME file.

## Donating

Please donate to a local pet shelter, or food pantry. It's been a wild time, but we can do our part by helping others. 
