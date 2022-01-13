
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

# Homebridge HS Plug Platform Plugin

This is a module to provide HomeBridge compatibility with TP-Link HS100 / HS110 plugs.  This was specifically built to address the breaking of functionality due to firmware version 1.1.0 on hardware version 4.1 plugs. These plugs appear to be only found with the UK and associated territories, so this module may not have a wide scope.  

Tested with:

- HS100 (UK)
- HS110 (UK)

I welcome any changes and I freely admit this is a very hacky implementation and I cannot offer any guaranties for both suitability or capability and this is used at your own risk. 

## Requirements & Notes

This plugin required a custom fork of [python-kasa](https://github.com/ghostseven/python-kasa), if you install the version currently found in the repository IT WILL NOT WORK.   

You first have to install my fork of python-kasa, which is located [here](https://github.com/ghostseven/python-kasa). I must offer a great debt of gratitude to [Simon Wilkinson](https://github.com/SimonWilkinson) , without his work on the python-kasa library none of this would be possible.  In fact, my fork of python-kasa simply includes further changes by Simon that has not been submitted to his own fork yet. 

With this setup I am going to assume you are on Linux or similar, if you are running on a different os you will have to adapt this. 

## Installation

1. Install HomeBridge.
2. Download my fork of [python-kasa](https://github.com/ghostseven/python-kasa).
3. Become root (actual root do not run the following command with sudo, so run sudo su or similar or log in as root).
4. Run the following command, make sure you keep the trailing slash on the path to the directory you cloned into as it makes sure pip3 uses that folder not a similarly named package from the repository.
```
    pip3 install python-kasa/ --system
```
5. Once this is installed switch back to a normal user and check you can run the command ‘kasa’
6. It is now best to test that you can run a discovery, there are a few parameters that maybe needed, it will depend on how your plugs are configured.  If you have 4.1 plugs that are configured on the TP-Link app and you have a username and password setup you will need to use the flags --user and –password. If you do not have a username and password configured (i.e the plugs have stopped working and you have not reset them) you can omit these. 
7. Run the following command to test discovery.
```
    kasa --klap --user ‘myusername’ --password ‘mypassword’
```
8. You should get a discovery result that shows all your plugs including any that are hardware 4.1 with firmware 1.1.0.
9. Install this plugin using: `npm install -g homebridge-hs-plug` or through Homebridge UI.
10. Update your Homebridge configuration file (`config.json`).

## Configuration

Avaliable platform configuration options are as follows:
- `platform` [required] this is always "HSPlug"
- `user` [optional] this is the username of your kasa app login
- `password` [optional] this is the password of your kasa app login
- `klaponly` [optional] this is a boolean to indicate you only was to use this plugin for the new 4.1 hardware. This allows you to keep on using your exisitng plugin setup for unaffected hardware. 

### Thanks / Credits

A big thanks to @simonwilkinson for his changes to the python-kasa library and his help via email. 
