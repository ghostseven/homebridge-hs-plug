import { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback, Logger} from 'homebridge';
import execa from 'execa';
import { HSPlugPlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class HSPlug {
  private service: Service;

  private switchStates = {
    On: false,
  };

  constructor(
    public readonly log: Logger,
    private readonly platform: HSPlugPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'TP-Link')
      .setCharacteristic(this.platform.Characteristic.Model, 'HS1XX')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
   
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .on('set', this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .on('get', this.getOn.bind(this));               // GET - bind to the `getOn` method below

    setInterval(() => {
      let execCMD = 'kasa ';

      //we only want to do the klap method of comms if we have a 4.1 hardware device running firmware 1.1.0
      if(this.accessory.context.device.hw === '4.1' && this.accessory.context.device.sw === '1.1.0'){
        execCMD += '--klap ';
        if(this.platform.config.user){
          execCMD += '--user \'' + this.platform.config.user + '\' --password \'' + this.platform.config.password + '\' ';
        }
      }  
      execCMD += '--host ' + this.accessory.context.device.host + ' --plug state';
      const output: string = this.execCommand(execCMD);
  
      const out = output.match('Device state:(.*)\\n');
      if(out){
        const strState: string = out[1].trim().toLocaleLowerCase();
        if(strState === 'on') {
          this.switchStates.On = true; this.service.updateCharacteristic(this.platform.Characteristic.On, true);
        }
        if(strState === 'off') {
          this.switchStates.On = false; this.service.updateCharacteristic(this.platform.Characteristic.On, false);
        }
      }
    }, 10000);  
  }


  setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {    
    this.switchStates.On = value as boolean;
    let strState: string;
    let execCMD = 'kasa ';

    (this.switchStates.On) ? strState = 'on' : strState = 'off';

    //we only want to do the klap method of comms if we have a 4.1 hardware device running firmware 1.1.0
    if(this.accessory.context.device.hw === '4.1' && this.accessory.context.device.sw === '1.1.0'){
      execCMD += '--klap ';
      if(this.platform.config.user !== undefined && this.platform.config.password !== undefined) {
        execCMD += '--user \'' + this.platform.config.user + '\' --password \'' + this.platform.config.password + '\' ';
      }      
    }

    execCMD += '--host ' + this.accessory.context.device.host + ' --plug ' + strState;
    //this.log.info(execCMD);
    this.log.debug(this.execCommand(execCMD));

    this.log.debug('Set Characteristic On ->', value);
    callback(null);
  }

  getOn(callback: CharacteristicGetCallback) {
    let execCMD = 'kasa ';

    //we only want to do the klap method of comms if we have a 4.1 hardware device running firmware 1.1.0
    if(this.accessory.context.device.hw === '4.1' && this.accessory.context.device.sw === '1.1.0'){
      execCMD += '--klap ';
      if(this.platform.config.user){
        execCMD += '--user \'' + this.platform.config.user + '\' --password \'' + this.platform.config.password + '\' ';
      }
    }  
    execCMD += '--host ' + this.accessory.context.device.host + ' --plug state';
    const output: string = this.execCommand(execCMD);

    const out = output.match('Device state:(.*)\\n');
    if(out){
      const strState: string = out[1].trim().toLocaleLowerCase();
      if(strState === 'on') {
        this.switchStates.On = true;
      }
      if(strState === 'off') {
        this.switchStates.On = false;
      }
    }
    const isOn = this.switchStates.On;
    this.platform.log.debug('Get Characteristic On ->', isOn);
    callback(null, isOn);
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
        //this.log.error("Unknown error received while attempting to execute command %s: %s.", command, error);
        return 'error';
      }

      //this.log.error("Error executing the command: %s.", error.message);
      return 'error';

    }
  }
}
