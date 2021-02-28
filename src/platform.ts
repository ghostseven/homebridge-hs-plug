import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import execa from 'execa';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { HSPlug } from './platformAccessory';

interface HSPlugConfig extends PlatformConfig {
  user?: string;
  password?: string;
  klaponly?: boolean;
}
export class HSPlugPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: HSPlugConfig,
    public readonly api: API,
  ) {
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
  configureAccessory(accessory: PlatformAccessory) {
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
    interface Plug{
      name: string;
      host: string;
      state: string;
      MAC: string;
      hw: string;
      sw: string;
    }
    const devices:Plug[] = [];
    
    let execCMD = 'kasa --klap ';
    if(this.config.user){
      execCMD += '--user \'' + this.config.user + '\' --password \'' + this.config.password + '\' ';
    }

    const output: string = this.execCommand(execCMD);

    const regex = /== (.*) ==\n(.*)Host/g;
    const result = output.match(regex) || [];

    result.forEach((value, index) => {
      let regex;
      let rStr: string;  
      if(index + 1 === result.length){
        rStr = value.substring(0, value.lastIndexOf('-')).replace('== ', '');
        regex = new RegExp(rStr + '(.*)', 's');
      }else{
        rStr = value.substring(0, value.lastIndexOf('-')).replace('== ', '');
        const nextValue = result[index+1];
        const nrStr = nextValue.substring(0, nextValue.lastIndexOf('-')).replace('== ', '');
        regex = new RegExp(rStr + '(.*)' + nrStr, 's');
      }
      const out = output.match(regex) || [];
      const plugStr = out[1];
      const rState = /Device state: (.*)/;
      const rHost = /Host: (.*)/;
      const rMAC = /MAC \(rssi\): {3}(.*) /;
      const rHw = /Hardware:(\s+)(\d+.\d+)/;
      const rSw = /Software:(\s+)(\d+.\d+.\d+)/;
      const plug: Plug = {name: rStr, host: (plugStr.match(rHost) || [])[1].toString(), 
        state: (plugStr.match(rState) || [])[1].toString(), MAC: (plugStr.match(rMAC) || [])[1].toString(),
        hw: (plugStr.match(rHw) || [])[2].toString(), sw: (plugStr.match(rSw) || [])[2].toString(),
      };


      //if we have klaponly set this will only add the new klap updated 4.1 plugs so you can keen on using your existing pluggin 
      //without overlap. 
      if(this.config.klaponly !== undefined){
        if(this.config.klaponly){
          if(plug.hw === '4.1' && plug.sw === '1.1.0'){
            devices.push(plug);
          }
        }else{
          devices.push(plug);
        }
      }else{
        devices.push(plug);
      }
    });

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of devices) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.MAC);

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
        new HSPlug(this.log, this, existingAccessory);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.name);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.name, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new HSPlug(this.log, this, accessory);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  // Execute a command, with error handling.
  private execCommand(command: string): string {
    try {

      // We only want the stdout property from the return of execa.command.
      const { stdout } = execa.commandSync(command, { shell: true });

      // Return the value.
      return stdout;

    } catch(error) {

      if(!(error instanceof Error)) {
        this.log.error('Unknown error received while attempting to execute command %s: %s.', command, error);
        return 'error';
      }

      this.log.error('Error executing the command: %s.', error.message);
      return 'error';

    }
  } 
}
