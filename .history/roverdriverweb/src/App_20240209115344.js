import React from 'react'
import { Grommet, Layer, Box, Header, Heading, Button, Tabs, Tab, ResponsiveContext, Collapsible, Clock } from 'grommet'
import { Connect, StatusGoodSmall, Trigger, Wifi, Info, Gamepad, DocumentTest, Configure, Close, Time } from 'grommet-icons'
import Rover from './Rover'
import TabSettings from './TabSettings'
import { RoverTheme } from './theme'
import { StateBox, MovingGraph, StyledCard, StyledNotification } from './CommonUI'
import './App.css';
import ls from 'local-storage'
import TabDrive from './TabDrive'
import TabLog from './TabLog'
import NewStatus from './NewStatus'
import NewDrive from './NewDrive'
import { LogFileService } from "./storage_service/logfile_service";
import { Gamepad as GamepadHandler } from 'react-gamepad';

const testingFunction = false;

var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

class App extends React.Component {

  _roverIMU = {}; // Fast updating IMU data
  // motor controller data objects
  _motorControllerFR = {};
  _motorControllerFL = {};
  _motorControllerRR = {};
  _motorControllerRL = {};
  _screenWakeLock;

  _gamepadUpdated = false;
  _leftStickX = 0;
  _leftStickY = 0;
  _keystate = ["70", "80", "50", "60"];

  constructor(props) {
    super(props);
    this.state = {
      themeMode: "dark",
      rover: null,
      notifications: [],
      isConnected: false,
      isConnecting: false,
      roverState: {},
      roverIMU: {},
      roverController: {},
      logging: false
    };
    this.handleConnectClick = this.handleConnectClick.bind(this);
    this.handleDisconnectClick = this.handleDisconnectClick.bind(this);
    this.handleSimulate = this.handleSimulate.bind(this);
    this.handleNotificationDismiss = this.handleNotificationDismiss.bind(this);
    this.handlePreferenceUpdate = this.handlePreferenceUpdate.bind(this);
    this.startLogging = this.startLogging.bind(this);
    this.stopLogging = this.stopLogging.bind(this);
    this.gamepadConnectHandler = this.gamepadConnectHandler.bind(this);
    this.gamepadDisconnectHandler = this.gamepadDisconnectHandler.bind(this);
    this.gamepadButtonChangeHandler = this.gamepadButtonChangeHandler.bind(this);
    this.gamepadAxisChangeHandler = this.gamepadAxisChangeHandler.bind(this);
  }

  componentDidMount() {
    let currentTheme = (ls.get('lightMode') || false) ? "light" : "dark";

    this.setState({
      ...this.state,
      themeMode: currentTheme,
      rover: new Rover()
    }, () => {
      // This function also updates state and cannot run concurrently without race conditions occuring
      document.addEventListener("swWaitingForUpdate", event => {
        this.showNotification("App updates ready", "status-ok", 1200000, "Reload now", () => {
          if (event.detail.waiting) event.detail.waiting.postMessage({ message: 'skipWaiting', type: 'SKIP_WAITING' });
        })
      });
    });
    document.addEventListener(visibilityChange, this.handleVisibilityChange);
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
  }

  componentWillUnmount() {
    this.disconnectRover();

    document.removeEventListener(visibilityChange, this.handleVisibilityChange);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
  }

  async acquireWakeLock(forceReaquire = false) {
    // acquire a new wake lock if the api is supported, the setting is true (or not set) and there is not one already
    // the final "no duplicates" condition can be overriden using forceReaquire (ie. if returning to tab)
    if ('wakeLock' in navigator && (ls.get('screenOn') !== null ? ls.get('screenOn') : true) && (!(this._screenWakeLock) || forceReaquire)) {
      // console.log('Acquiring new wake lock');
      try {
        this._screenWakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        // The Wake Lock request has failed - usually system related, such as battery.
        console.log(err);
      }
    } else {
      // console.log('Wake lock is not supported by this browser, setting is disabled or already running.');
    }
  }

  releaseWakeLock(forceRelease = false) {
    // Release the wake lock if (we are not logging or controlling) OR (forceRelease == true)
    // forceRelease can be set if the rover has been disconnected
    if (this._screenWakeLock && ((!(this.state.logging) && this.state.roverState.status !== 2) || forceRelease)) this._screenWakeLock.release()
      .then(() => {
        // console.log("Wake lock released");
        this._screenWakeLock = null;
      });
  }

  //handleKeyDown = (event) => {
  //  if (event.repeat !== true && this.state.isConnected && this.state.roverState.status === 2) {
  //    event.preventDefault();
  //    event.stopPropagation();
  //    let downData = "";
  //    switch (event.keyCode) {
  //      case (87):
  //        // W
  //        downData = "51";
  //        break;
  //      case (65):
  //        // A
  //        downData = "71";
  //        break;
  //      case (83):
  //        // S
  //        downData = "61";
  //        break;
  //      case (68):
  //        // D
  //        downData = "81";
  //        break;
  //      case (39):
  //        // Up arrow
  //        downData = "11";
  //        break;
  //      case (37):
  //        // Down arrow
  //        downData = "21";
  //        break;
  //      default:
  //        console.log("Down: " + event.keyCode);
  //    }
  //    if (downData !== "") {
  //      this.state.rover.queueKey(0xCA, downData);
  //    } else if (event.keyCode === 27) {
  //      // Esc pressed, disable control
  //      this.state.rover.queueSubject(0xC0);
  //    }
  //  }
  //}

  handleKeyUp = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (this.state.isConnected && this.state.roverState.status === 2) {
      let upData = "";
      switch (event.keyCode) {
        case (87):
          // W
          upData = "50";
          break;
        case (65):
          // A
          upData = "70";
          break;
        case (83):
          // S
          upData = "60";
          break;
        case (68):
          // D
          upData = "80";
          break;
        case (38):
          // Up arrow
          break;
        case (40):
          // Down arrow
          break;
        default:
        // console.log("Down: " + event.keyCode);
      }
      if (upData !== "") {
        this.state.rover.queueKey(0xCA, upData);
      }
    }
  }

  handleVisibilityChange = () => {
    if (document[hidden]) {
      // Update state when page is not visible
      if (this.state.isConnected) this.state.rover.stopTxNotifications(this.handleRoverTX);
      if (this.state.logging) this.stopLogging(true); // pause logging
      if (this.updateInterval) clearInterval(this.updateInterval);
      if (this.gamepadInterval) clearInterval(this.gamepadInterval);
    } else {
      // Update state when page is visible
      if (this.state.isConnected) {
        // Warn user if app is currently conntected to a device that messages may have been missed
        this.showNotification("Rover updates and logging are paused while the app is hidden", "status-warning", 5000);
        // Restart rover BLE tx notifications
        this.state.rover.startTxNotifications(this.handleRoverTX);
        // Restart logging if previously logging
        if (this.state.logging) this.startLogging(this.state.logging.tableID, this.state.logging.interval, this.state.logging.targets, true);
        // Start UI updates for real-time data
        this.updateInterval = setInterval(this.intervalUpdateState, 500);
        this.gamepadInterval = setInterval(this.intervalSendGamepad, 50);
        // Reacquiring a wake lock if enabled
        if (this._screenWakeLock !== null) this.acquireWakeLock(true);
      }
    }
  }

  handlePreferenceUpdate() {
    let currentTheme = (ls.get('lightMode') || false) ? "light" : "dark";
    this.setState({ ...this.state, themeMode: currentTheme })
  }

  showNotification(message, color, duration, actiontext = false, actionhandle = false) {
    let notifications = this.state.notifications;
    let key = Date.now();
    let notification = {
      key: key,
      text: message,
      closeHandler: this.handleNotificationDismiss,
      background: color,
      actionText: actiontext,
      actionHandle: (key) => {
        actionhandle();
        this.handleNotificationDismiss(key);
      }
    };
    notifications.push(notification);
    this.setState({ ...this.state, notifications: notifications });
    setTimeout(() => {
      this.dismissNotification(key);
    }, duration);
  };

  dismissNotification(key) {
    let notifications = this.state.notifications;
    const found = notifications.findIndex(element => element.key === key);
    if (found > -1) {
      notifications.splice(found, 1);
      this.setState({ ...this.state, notifications: notifications });
    }
  }

  handleNotificationDismiss(key) {
    this.dismissNotification(key);
  }

  startLogging(tableID, interval, targets, restartFromPaused = false) {
    // set logging flag if this isn't a restart from a temporary pause
    if (!restartFromPaused) {
      this.acquireWakeLock();
      this.setState({
        ...this.state, logging: {
          tableID: tableID,
          interval: interval,
          targets: targets
        }
      }, () => {
        this.showNotification("Logging started", "status-ok", 3000);
      });
    }
    this.LogFileService = new LogFileService(tableID);
    this.loggingID = window.setInterval(() => {
      // console.log("Log: " + tableID);
      var snapshot = {};
      snapshot.timestamp = new Date();
      snapshot.data = {};
      // go through each logged item and save the corrosponding data
      if (targets.accel && this._roverIMU && this._roverIMU.accel) snapshot.data.accelerometer = this._roverIMU.accel[this._roverIMU.accel.length - 1];
      if (targets.gyro && this._roverIMU && this._roverIMU.gyro) snapshot.data.gyroscope = this._roverIMU.gyro[this._roverIMU.gyro.length - 1];
      if (targets.magnet && this._roverIMU && this._roverIMU.field) snapshot.data.magnetometer = this._roverIMU.field[this._roverIMU.field.length - 1];
      if (targets.motor) {
        if (this._motorControllerFR) snapshot.data.motorControllerFR = this._motorControllerFR;
        if (this._motorControllerFL) snapshot.data.motorControllerFL = this._motorControllerFL;
        if (this._motorControllerRR) snapshot.data.motorControllerRR = this._motorControllerRR;
        if (this._motorControllerRL) snapshot.data.motorControllerRL = this._motorControllerRL;
      }
      if (targets.stats && this.state.roverState && this.state.roverState.voltage) snapshot.data.voltage = this.state.roverState.voltage;
      this.LogFileService.addLogRow(snapshot)
        .catch(exception => {
          console.log(exception);
          this.showNotification(exception.message, "status-critical", 3000)
        });
    }, interval);
  }

  stopLogging(restartFromPaused = false) {
    if (this.loggingID) {
      clearInterval(this.loggingID);
      // set logging flag if this isn't a temporary pause
      if (!restartFromPaused) this.setState({ ...this.state, logging: false }, () => {
        this.releaseWakeLock();
        this.showNotification("Logging stopped", "status-critical", 3000);
      });
      this.loggingID = null;
    }
  }
  /*
  Take in CharCode containing three-axis data split by semicolons and
  the array to manipulate. Returns the array of length 20 (
  corresponding to about 10 seconds of sensor data at 2Hz) with the new
  item added.
  */
  addMovingData(item, dataSet) {
    if (item.length === 13) {
      let currentTime = new Date().toLocaleTimeString();
      let incomingItem = new DataView(item.buffer, 0);
      // Check if dataSet already has items
      if (dataSet !== undefined) {
        // Trim dataSet if it already has 39 items (will be 40 items after append)
        if (dataSet.length > (99)) dataSet.shift();
      } else {
        // Create an array of 39 items with zeros just to fill up the
        // chart on first render
        dataSet = Array(99).fill({ "time": currentTime, "X": 0.0, "Y": 0.0, "Z": 0.0 });
      }
      // Save new item coordinates
      dataSet.push({ "time": currentTime, "X": incomingItem.getFloat32(1, true), "Y": incomingItem.getFloat32(5, true), "Z": incomingItem.getFloat32(9, true) });
    } else {
      console.log("Invalid number of coordinates recieved");
    }
    return dataSet;
  }

  handleSimulate(e) {
    e.preventDefault();
    // Helper for whatever I'm working on
    this.showNotification("This is a test notification", "status-ok", 4000);
  }

  disconnectRover() {
    if (this.state.isConnected === true) {
      try {
        this.state.rover.disconnect();
      } catch (exception) {
        this.showNotification(exception.message, "status-critical", 5000);
        console.log(exception);
      }
    }
  }

  handleRoverDisconnect = (event) => {
    this.showNotification("Rover connection lost", "status-critical", 5000);
    this.releaseWakeLock(true);
    this._roverIMU = {};
    this._motorControllerFL = {};
    this._motorControllerFR = {};
    this._motorControllerRR = {};
    this._motorControllerRL = {};
    this.setState({ ...this.state, isConnected: false, isConnecting: false, roverState: {}, roverIMU: {}, roverController: {} }, () => {
      // If we are logging, stop it. This also does a setState so should occur after the initial setState
      if (this.state.logging) this.stopLogging();
    });
    if (this.updateInterval) clearInterval(this.updateInterval);
    if (this.gamepadInterval) clearInterval(this.gamepadInterval);
  }

  parseMotorControllerStatus(data) {
    let status = {};
    status.voltage = data.getUint16(4, true) / 1000.0;
    status.current = data.getInt16(6, true);
    status.dutyCycleTarget = data.getInt16(8, true);
    status.dutyCycle = data.getInt16(10, true);
    status.feedback = data.getUint16(12, true);
    status.online = data.getInt8(1);

    // If device is offline, that is the only error
    if (status.online === -1) {
      status.error = "Offline";
    } else {
      // check what error bits are set
      let jrkErrors = [
        { byte: 0, bit: 1, error: "Low VIN" },
        { byte: 0, bit: 2, error: "Motor driver error" },
        { byte: 0, bit: 3, error: "Invalid input (RC)" },
        { byte: 0, bit: 4, error: "Input disconnect" },
        { byte: 0, bit: 5, error: "Feedback disconnected" },
        { byte: 0, bit: 6, error: "Soft overcurrent" },
        { byte: 0, bit: 7, error: "Serial signal error" },
        { byte: 1, bit: 0, error: "Serial overrun" },
        { byte: 1, bit: 1, error: "Serial RX buffer full" },
        { byte: 1, bit: 2, error: "Serial CRC error" },
        { byte: 1, bit: 3, error: "Serial protocol error" },
        { byte: 1, bit: 4, error: "Serial timeout error" },
        { byte: 1, bit: 5, error: "Hard overcurrent" },
      ]

      status.error = "";
      let errorByte = 2;
      // generate error string
      jrkErrors.forEach((error) => {
        if ((data.getInt8(errorByte + error.byte) & (1 << error.bit)) !== 0)
          status.error = status.error + ", " + error.error;
      });
      if (status.error.charAt(0) === ',')
        status.error = status.error.slice(2);
    }
    return status;
  }

  handleRoverTX = (event) => {
    let message = new Uint8Array(event.target.value.buffer);
    //console.log(">" + String.fromCharCode.apply(null, message));

    if (message.length > 1) {
      switch (message[0]) {
        case 0xA1:
          // Status
          let statusColor;
          let statusMessage;
          switch (message[1]) {
            case 0x00:
              statusColor = "status-ok";
              statusMessage = "IDLE - SAFE TO APPROACH";
              break;
            case 0x01:
              statusColor = "status-warning";
              statusMessage = "READY - STAND CLEAR";
              this.releaseWakeLock();
              break;
            case 0x02:
              statusColor = "status-critical";
              statusMessage = "MOTORS ON - DO NOT APPROACH";
              this.acquireWakeLock();
              break;
            default:
              statusColor = "status-unknown";
              statusMessage = "UNKNOWN";
              break;
          }
          this.setState({
            ...this.state, roverState: {
              ...this.state.roverState,
              status: message[1],
              statusColor: statusColor,
              statusMessage: statusMessage
            }
          });
          break;
        case 0xA2:
          // Voltage
          let voltage = ((new DataView(message.buffer, 0)).getFloat32(1, true));
          this.setState({ ...this.state, roverState: { ...this.state.roverState, voltage: voltage } });
          break;
        case 0xA3:
          // On time
          // Arduino unsigned long is equivilant to Uint32, little endian... I think?
          this.setState({ ...this.state, roverState: { ...this.state.roverState, ontime: new Date((new DataView(message.buffer, 0)).getUint32(1, true)).toISOString() } });
          break;
        case 0xA4:
          // RSSI
          let rssi = (new DataView(message.buffer, 0)).getInt8(1);
          let rssiString = "";
          if (rssi === 0) {
            rssiString = "Unknown";
          } else if (rssi > -45) {
            rssiString = "Excellent";
          } else if (rssi > -60) {
            rssiString = "Very Good";
          } else if (rssi > -75) {
            rssiString = "Good";
          } else if (rssi > -90) {
            rssiString = "Poor";
          } else {
            rssiString = "Very Poor";
          }
          // Only append RSSI if user set it in settings
          if (ls.get('rssi') || false) rssiString += " (" + rssi + ")";
          this.setState({ ...this.state, roverState: { ...this.state.roverState, rssi: rssiString } });
          break;
        case 0xB1:
          // Accelerometer
          // Parse value, removing subject byte
          let accelData = this.addMovingData(message, this._roverIMU.accel);
          // Save data back to state
          this._roverIMU = { ...this._roverIMU, accel: accelData };
          break;
        case 0xB2:
          // Gyroscope
          // Parse value, removing subject byte
          let gyroData = this.addMovingData(message, this._roverIMU.gyro);
          // Save data back to state
          this._roverIMU = { ...this._roverIMU, gyro: gyroData };
          break;
        case 0xB3:
          // Magnetometer
          // Parse value, removing subject byte
          let fieldData = this.addMovingData(message, this._roverIMU.field);
          // Save data back to state
          this._roverIMU = { ...this._roverIMU, field: fieldData };
          break;
        case 0xCE:
          // Target speed
          // Parse value as integer, removing subject byte
          this.setState({ ...this.state, roverState: { ...this.state.roverState, speed: (new DataView(message.buffer, 0)).getUint8(1) } });
          break;
        case 0xD1:
          // Front right motor controller status
          let jrkFR = new DataView(message.buffer, 0);
          this._motorControllerFR = this.parseMotorControllerStatus(jrkFR);
          break;
        case 0xD2:
          // Front left motor controller status
          let jrkFL = new DataView(message.buffer, 0);
          this._motorControllerFL = this.parseMotorControllerStatus(jrkFL);
          break;
        case 0xD3:
          // Rear right motor controller status
          let jrkRR = new DataView(message.buffer, 0);
          this._motorControllerRR = this.parseMotorControllerStatus(jrkRR);
          break;
        case 0xD4:
          // Rear left motor controller status
          let jrkRL = new DataView(message.buffer, 0);
          this._motorControllerRL = this.parseMotorControllerStatus(jrkRL);
          break;
        default:
          console.log("Unknown Message: " + String.fromCharCode.apply(null, message));
      }
    }
  }

  intervalUpdateState = () => {
    // Update state of rapidly changing data by deep copying
    this.setState({
      ...this.state,
      roverIMU: JSON.parse(JSON.stringify(this._roverIMU)),
      roverController: {
        FR: JSON.parse(JSON.stringify(this._motorControllerFR)),
        FL: JSON.parse(JSON.stringify(this._motorControllerFL)),
        RR: JSON.parse(JSON.stringify(this._motorControllerRR)),
        RL: JSON.parse(JSON.stringify(this._motorControllerRL))
      }
    });
  }

  handleConnectClick(e) {
    e.preventDefault();
    this.setState({ ...this.state, isConnecting: true });
    this.state.rover.request()
      .then(_ => this.state.rover.connect())
      .then((bluetoothRemoteGATTServer) => { /* Do something with rover... */
        console.log(this.state.rover.getDevice());
        this.state.rover.getDevice().addEventListener('gattserverdisconnected', this.handleRoverDisconnect);
        this.state.rover.startTxNotifications(this.handleRoverTX);
        this.setState({ ...this.state, isConnected: true, isConnecting: false });
        this.updateInterval = setInterval(this.intervalUpdateState, 500);
        this.gamepadInterval = setInterval(this.intervalSendGamepad, 50);
      })
      .catch(error => {
        console.log(error.name);
        // show a notification if the error is not due to the user
        // dismissing the connection prompt
        if (error.name !== "NotFoundError") {
          this.showNotification(error.message + " Try again.", "status-critical", 4000);
        }
        this.setState({ ...this.state, isConnected: false, isConnecting: false });
      });
  }

  handleDisconnectClick(e) {
    e.preventDefault();
    this.disconnectRover();
  }

  intervalSendGamepad = () => {
    if (this.state.isConnected && this.state.roverState.status === 2 && this._gamepadUpdated) {
      this._gamepadUpdated = false;
      var keys = ["70", "80", "50", "60"]; // left, right, up, down

      if (this._leftStickX > 0.5) {
        // Right
        keys[1] = "81";
      } else if (this._leftStickX < -0.5) {
        // Left
        keys[0] = "71";
      }

      if (this._leftStickY > 0.5) {
        // Up
        keys[2] = "51";
      } else if (this._leftStickY < -0.5) {
        // Down
        keys[3] = "61";
      }

      for (let i = 0; i < keys.length; i++) {
        // Only send if key states have changed
        if (keys[i] !== this._keystate[i]) {
          this.state.rover.queueKey(0xCA, keys[i]);
        }
      }
      this._keystate = keys;
    }
  }

  gamepadConnectHandler(gamepadIndex) {
    //console.log(`Gamepad ${gamepadIndex} connected !`)
  }

  gamepadDisconnectHandler(gamepadIndex) {
    //console.log(`Gamepad ${gamepadIndex} disconnected !`)
    if (this.state.isConnected && this.state.roverState.status === 2) {
      this.state.rover.queueKey(0xCA, "50");
      this.state.rover.queueKey(0xCA, "70");
      this.state.rover.queueKey(0xCA, "60");
      this.state.rover.queueKey(0xCA, "80");
    }
    this._leftStickX = 0;
    this._leftStickY = 0;
    this._gamepadUpdated = true;
  }

  gamepadButtonChangeHandler(buttonName, down) {
    if (this.state.isConnected && this.state.roverState.status === 2 && down === true) {
      let downData = "";
      switch (buttonName) {
        case ("RB"):
          // Up arrow
          downData = "11";
          break;
        case ("LB"):
          // Down arrow
          downData = "21";
          break;
        default:
          // Do nothing
          break;
      }
      if (downData !== "") {
        this.state.rover.queueKey(0xCA, downData);
      }
    }
  }

  gamepadAxisChangeHandler(axisName, value, previousValue) {
    if (axisName === "LeftStickX") {
      this._leftStickX = value;
    } else if (axisName === "LeftStickY") {
      this._leftStickY = value;
    }
    this._gamepadUpdated = true;
  }

  render() {
    return (
      <Grommet full theme={RoverTheme} themeMode={this.state.themeMode}>
        <Layer
          className="notificationLayer"
          position="bottom"
          modal={false}
          margin={{ vertical: 'medium', horizontal: 'small' }}
          responsive={false}
          plain
        >
          <Box width={{ "max": "1250px" }} gap="small">
            {this.state.notifications.map((notification) =>
              <StyledNotification actionHandle={notification.actionHandle} actionText={notification.actionText} key={notification.key} id={notification.key} text={notification.text} onClose={notification.closeHandler} background={notification.background} />
            )}
          </Box>
        </Layer>
        {this.state.isConnected && this.state.roverState.status === 2 && <GamepadHandler
          onConnect={this.gamepadConnectHandler}
          onDisconnect={this.gamepadDisconnectHandler}

          onButtonChange={this.gamepadButtonChangeHandler}
          onAxisChange={this.gamepadAxisChangeHandler}
        >
          <React.Fragment />
        </GamepadHandler>}
        <Box fill="vertical" overflow="auto" align="center" flex="grow">
          <Header className="appHeader" align="end" justify="center" pad="medium" gap="medium" background={{ "color": (this.state.roverState.status && this.state.roverState.voltage !== undefined && this.state.roverState.voltage <= 13.2) ? "status-critical" : "background-contrast" }} fill="horizontal">
            <ResponsiveContext.Consumer>
              {size => (
                <Box className="appHeaderBox" align="center" direction={(size !== "small" && size !== "xsmall") ? "row" : "column-reverse"} flex="grow" justify="between" width={{ "max": "1250px" }} wrap="reverse">
                  <Box align="center" justify="center" direction="column" gap="small">
                    {(size !== "small" && size !== "xsmall" &&
                      <Heading level="2" margin="none" textAlign="start">
                        {this.state.isConnected ? "Connected" : "Not Connected"}
                      </Heading>
                    )}
                    {this.state.isConnected ? <Button label="Disconnect" onClick={this.handleDisconnectClick} icon={<Close />} disabled={false} primary /> : <Button label="Connect" onClick={this.handleConnectClick} icon={<Connect />} disabled={this.state.isConnecting} primary />}
                  </Box>
                  {testingFunction && <Button label="Try Me" onClick={this.handleSimulate} icon={<Connect />} primary />}
                  <Box justify="center" direction="row" gap="medium" margin={(size === "small" || size === "xsmall") ? { "bottom": "medium" } : "none"}>
                    <Collapsible direction="vertical" open={this.state.isConnected}>
                      <Box align="end" justify="center" direction="column">
                        <Heading level="3" margin="none" textAlign="start">
                          {this.state.isConnected ? this.state.rover.getDevice().name : "-"} {this.state.logging && " [logging]"}
                        </Heading>
                        <Heading level="4" margin="none" textAlign="start">
                          {this.state.roverState && this.state.roverState.statusMessage ? this.state.roverState.statusMessage : "UNKNOWN"}
                        </Heading>
                      </Box>
                    </Collapsible>
                    <StatusGoodSmall color={this.state.roverState && this.state.roverState.statusColor ? this.state.roverState.statusColor : "status-unknown"} size="large" />
                  </Box>

                </Box>
              )}

            </ResponsiveContext.Consumer>
          </Header>
          <Box className="box_Content" fill="horizontal" width={{ "max": "1250px" }}>
            <Tabs justify="center" flex>
              <Tab title="New Drive" icon={<Gamepad />} >
                <NewDrive rover={this.state.rover} isConnected={this.state.isConnected} roverState={this.state.roverState} />
              </Tab>
              <Tab title="New Status" icon={<Info />}>
                  <Box justify="center" pad={{ "top": "none", "bottom": "small", "left": "small", "right": "small" }} className="tabContents" animation={{ "type": "fadeIn", "size": "small" }} direction="row" align="stretch" fill hoverIndicator={false}>
                    <StyledCard title="System" wide>
                      <StateBox icon={<Trigger size="medium" />} name="Battery" error={(this.state.roverState.status && this.state.roverState.voltage !== undefined && this.state.roverState.voltage <= 13.2) ? 1 : 0} unit="V" value={this.state.roverState.voltage !== undefined ? (Math.round(this.state.roverState.voltage * 100) / 100).toFixed(1) : "-"} />
                      <StateBox icon={<Wifi size="medium" />} name="Signal strength" value={this.state.roverState.rssi ? this.state.roverState.rssi : "-"} />
                      <StateBox icon={<Time size="medium" />} name="On time" value={!this.state.roverState.ontime && "-"}>
                        {this.state.roverState.ontime && <Clock type="digital" time={this.state.roverState.ontime} />}
                      </StateBox>
                    </StyledCard>
                    <StyledCard wide>
                      <NewStatus rover={this.state.rover} roverController={this.state.roverController} />
                    </StyledCard>
                    <StyledCard wide title="Acceleration - should be Velocity" foottext={!(this.state.roverIMU.accel) && "Real velocity plot over time"}>
                      {this.state.roverIMU.accel && (<>
                        <Box align="center" justify="center">
                          <MovingGraph data={this.state.roverIMU.accel} unit="m/s2" />
                        </Box>
                      </>)}
                    </StyledCard>
                    <StyledCard wide title="Angular velocity" foottext={!(this.state.roverIMU.gyro) && "Yaw, pitch, roll"}>
                      {this.state.roverIMU.gyro && (<>
                        <Box align="center" justify="center">
                          <MovingGraph data={this.state.roverIMU.gyro} unit="°/s" />
                        </Box>
                      </>)}
                    </StyledCard>
                    <StyledCard wide title="OBC Status" foottext={"Temperatures data"}>
                        <Box align="center" justify="center">
                        </Box>
                    </StyledCard>
                  </Box>
              </Tab>
              <Tab title="Log" plain={false} disabled={false} icon={<DocumentTest />}>
                <TabLog isConnected={this.state.isConnected} roverState={this.state.roverState} isLogging={this.state.logging} startLogging={this.startLogging} stopLogging={this.stopLogging} />
              </Tab>
              <Tab title="Settings" plain={false} disabled={false} icon={<Configure />}>
                <TabSettings onPreferenceUpdate={this.handlePreferenceUpdate} />
              </Tab> 
            </Tabs>
          </Box>
        </Box>
      </Grommet>
    )
  }
}

export default App;