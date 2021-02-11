import React from 'react'
import { Grommet, Layer, Box, Header, Heading, Button, Tabs, Tab, Stack, Diagram, ResponsiveContext, Collapsible } from 'grommet'
import { Connect, StatusGoodSmall, Trigger, Wifi, Info, Gamepad, DocumentTest, Configure, Close } from 'grommet-icons'
import Rover from './Rover'
import TabSettings from './TabSettings'
import { RoverTheme } from './theme'
import { StateBox, MovingGraph, StyledCard, StyledNotification } from './CommonUI'
import './App.css';
import ls from 'local-storage'

const testingFunction = false;

var hidden, visibilityChange;
var pageVisible = true;
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

  constructor(props) {
    super(props);
    this.state = {
      themeMode: "dark",
      rover: null,
      notifications: [],
      isConnected: false,
      isConnecting: false,
      roverState: {},
      roverIMU: {}
    };
    this.handleConnectClick = this.handleConnectClick.bind(this);
    this.handleDisconnectClick = this.handleDisconnectClick.bind(this);
    this.handleSimulate = this.handleSimulate.bind(this);
    this.handleNotificationDismiss = this.handleNotificationDismiss.bind(this);
    this.handlePreferenceUpdate = this.handlePreferenceUpdate.bind(this);
  }

  componentDidMount() {
    this.setState({ ...this.state, rover: new Rover() }, () => this.handlePreferenceUpdate());
    document.addEventListener(visibilityChange, () => {
      this.handleVisibilityChange();
    }, false);
  }

  componentWillUnmount() {
    this.disconnectRover()
    document.removeEventListener(visibilityChange, () => {
      this.handleVisibilityChange();
    });
  }

  handleVisibilityChange() {
    if (document[hidden]) {
      // Update state when page is not visible
      pageVisible = false;
    } else {
      // Update state when page is visible
      pageVisible = true;
      // Warn user if app is currently conntected to a device that messages may have been missed
      if (this.state.isConnected) this.showNotification("Device updates, warnings and logging are paused while the app is hidden", "status-warning", 5000);
    }
  }

  handlePreferenceUpdate(){
    let currentTheme = (ls.get('lightMode') || false) ? "light" : "dark";
    this.setState({ ...this.state, themeMode: currentTheme})
  }

  showNotification(message, color, duration) {
    let notifications = this.state.notifications;
    let key = Date.now
    let notification = {
      key: key,
      text: message,
      closeHandler: this.handleNotificationDismiss,
      background: color
    };
    notifications.push(notification);
    this.setState({ ...this.state, notifications: notifications });
    setTimeout(() => {
      this.dismissNotification(key);
    }, duration);
  };

  dismissNotification(key){
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

  /*
  Take in CharCode containing three-axis data split by semicolons and
  the array to manipulate. Returns the array of length 20 (
  corrosponding to about 10 seconds of sensor data) with the new
  item added.
  */
  addMovingData(item, dataSet) {
    let itemValues = String.fromCharCode.apply(null, item).split(";");
    if (itemValues.length === 3) {
      let currentTime = new Date().toLocaleTimeString();
      // Check if dataSet already has items
      if (dataSet !== undefined) {
        // Trim dataSet if it already has 19 items (will be 20 items after append)
        if (dataSet.length > (19)) dataSet.shift();
      } else {
        // Create an array of 19 items with zeros just to fill up the
        // chart on first render
        dataSet = Array(19).fill({ "time": currentTime, "X": 0, "Y": 0, "Z": 0 });
      }
      // Save new item coordinates
      dataSet.push({ "time": currentTime, "X": parseFloat(itemValues[0]), "Y": parseFloat(itemValues[1]), "Z": parseFloat(itemValues[2]) });
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

  handleUARTTX(event) {
    let message = new Uint8Array(event.target.value.buffer);
    //console.log(">" + String.fromCharCode.apply(null, message));

    if (message.length > 1) {
      switch (message[0]) {
        case 0xA1:
          // Status
          this.setState({ ...this.state, roverState: { ...this.state.roverState, status: message[1] } });
          break;
        case 0xA2:
          // Voltage
          this.setState({ ...this.state, roverState: { ...this.state.roverState, voltage: String.fromCharCode.apply(null, message.slice(1)) } });
          break;
        case 0xB1:
          // Accelerometer
          // Parse value, removing subject byte
          let accelData = this.addMovingData(message.slice(1), this.state.roverIMU.accel);
          // Save data back to state
          this.setState({ ...this.state, roverIMU: { ...this.state.roverIMU, accel: accelData } });
          break;
        case 0xB2:
          // Gyroscope
          // Parse value, removing subject byte
          let gyroData = this.addMovingData(message.slice(1), this.state.roverIMU.gyro);
          // Save data back to state
          this.setState({ ...this.state, roverIMU: { ...this.state.roverIMU, gyro: gyroData } });
          break;
        case 0xB3:
          // Magnetometer
          // Parse value, removing subject byte
          let fieldData = this.addMovingData(message.slice(1), this.state.roverIMU.field);
          // Save data back to state
          this.setState({ ...this.state, roverIMU: { ...this.state.roverIMU, field: fieldData } });
          break;
        default:
          console.log("Unknown Message: " + String.fromCharCode.apply(null, message));
      }
    }
  }

  disconnectRover() {
    if (this.state.isConnected === true) {
      this.state.rover.disconnect();
    }
    this.setState({ ...this.state, isConnected: false, isConnecting: false, roverState: {}, roverIMU: {} });
  }

  handleConnectClick(e) {
    e.preventDefault();
    this.setState({ ...this.state, isConnecting: true });
    this.state.rover.request()
      .then(_ => this.state.rover.connect())
      .then((bluetoothRemoteGATTServer) => { /* Do something with rover... */
        console.log(this.state.rover.getDevice());
        this.state.rover.getDevice().addEventListener('gattserverdisconnected', _ => {
          this.showNotification("Rover connection lost", "status-critical", 5000);
          this.setState({ ...this.state, isConnected: false, isConnecting: false, roverState: {}, roverIMU: {} });
        });
        this.state.rover.startTxNotifications((event) => {
          // only parse incoming data if page is visible to prevent
          // unresponsive states after returning to app
          if (pageVisible === true)
            this.handleUARTTX(event)
        });
        this.setState({ ...this.state, isConnected: true, isConnecting: false });
      })
      .catch(error => {
        console.log(error.name);
        // show a notification if the error is not due to the user
        // dismissing the connection prompt
        if(error.name !== "NotFoundError"){
          this.showNotification(error.message + " Try again.", "status-critical", 4000);
        }
        this.setState({ ...this.state, isConnected: false, isConnecting: false });
      });
  }

  handleDisconnectClick(e) {
    e.preventDefault();
    this.disconnectRover();
  }

  render() {
    let statusColor = "status-unknown";
    let statusMessage = "UNKNOWN";
    switch (this.state.roverState.status) {
      case 0:
        statusColor = "status-ok";
        statusMessage = "IDLE - SAFE TO APPROACH";
        break;
      case 1:
        statusColor = "status-warning";
        statusMessage = "READY - STAND CLEAR";
        break;
      case 2:
        statusColor = "status-critical";
        statusMessage = "MOTORS POWERED - DO NOT APPROACH";
        break;
      default:
        statusColor = "status-unknown";
        statusMessage = "UNKNOWN";
        break;
    }

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
              <StyledNotification key={notification.key} id={notification.key} text={notification.text} onClose={notification.closeHandler} background={notification.background} />
            )}
          </Box>
        </Layer>
        <Box fill="vertical" overflow="auto" align="center" flex="grow">
          <Header className="appHeader" align="end" justify="center" pad="medium" gap="medium" background={{ "color": "background-contrast" }} fill="horizontal">
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
                          {this.state.isConnected ? this.state.rover.getDevice().name : "-"}
                        </Heading>
                        <Heading level="4" margin="none" textAlign="start">
                          {statusMessage}
                        </Heading>
                      </Box>
                    </Collapsible>
                    <StatusGoodSmall color={statusColor} size="large" />
                  </Box>

                </Box>
              )}

            </ResponsiveContext.Consumer>
          </Header>
          <Box className="box_Content" fill="horizontal" width={{ "max": "1250px" }}>
            <Tabs justify="center" flex>
              <Tab title="Status" icon={<Info />}>
                <Box justify="center" pad={{ "top": "none", "bottom": "medium", "left": "small", "right": "small" }} className="tabContents" animation={{ "type": "fadeIn", "size": "small" }} direction="row" align="stretch" fill hoverIndicator={false}>
                  <StyledCard title="System" >
                    <StateBox icon={<Trigger size="medium" />} name="Battery" unit="V" value={this.state.roverState.voltage ? this.state.roverState.voltage : "-"} />
                    <StateBox icon={<Wifi size="medium" />} name="Signal Strength" value={this.state.isConnected ? "Medium" : "-"} />
                  </StyledCard>
                  <StyledCard wide title="Acceleration" foottext={!(this.state.roverIMU.accel) && "waiting for data"}>
                    {this.state.roverIMU.gyro && (<>
                      <Box align="center" justify="center">
                        <MovingGraph data={this.state.roverIMU.accel} unit="m/s2" />
                      </Box>
                    </>)}
                  </StyledCard>
                  <StyledCard wide title="Angular velocity" foottext={!(this.state.roverIMU.gyro) && "waiting for data"}>
                    {this.state.roverIMU.gyro && (<>
                      <Box align="center" justify="center">
                        <MovingGraph data={this.state.roverIMU.gyro} unit="°/s" />
                      </Box>
                    </>)}
                  </StyledCard>
                  <StyledCard wide title="Magnetic field" foottext={!(this.state.roverIMU.field) && "waiting for data"}>
                    {this.state.roverIMU.field && (<>
                      <Box align="center" justify="center">
                        <MovingGraph data={this.state.roverIMU.field} unit="G" />
                      </Box>
                    </>)}
                  </StyledCard>
                </Box>
              </Tab>
              <Tab title="Drive" icon={<Gamepad />} >
                <Box justify="center" pad={{ "top": "none", "bottom": "medium", "left": "small", "right": "small" }} className="tabContents" animation={{ "type": "fadeIn", "size": "small" }} direction="row" fill hoverIndicator={false}>
                  <StyledCard foottext={this.state.isConnected ? "Error: right front controller - low voltage" : ""}>
                    <Box align="center" justify="center" margin={{ "bottom": "small" }}>
                      <Stack guidingChild={1}>
                        <Diagram
                          connections={[
                            {
                              fromTarget: '1',
                              toTarget: '0',
                              thickness: 'xsmall',
                              color: this.state.isConnected ? "accent-4" : "status-unknown",
                              type: 'curved',
                            },
                            {
                              fromTarget: '2',
                              toTarget: '0',
                              thickness: 'xsmall',
                              color: this.state.isConnected ? "status-warning" : "status-unknown",
                              type: 'curved',
                            },
                            {
                              fromTarget: '3',
                              toTarget: '0',
                              thickness: 'xsmall',
                              color: this.state.isConnected ? "accent-4" : "status-unknown",
                              type: 'curved',
                            },
                            {
                              fromTarget: '4',
                              toTarget: '0',
                              thickness: 'xsmall',
                              color: this.state.isConnected ? "accent-4" : "status-unknown",
                              type: 'curved',
                            }
                          ]}
                        />
                        <Box>
                          <Box direction="row">
                            <Box id="1" margin="small" pad="medium" background={this.state.isConnected ? "status-ok" : "status-unknown"} />
                            <Box id="5" margin="small" pad="medium" background="none" />
                            <Box id="2" margin="small" pad="medium" background={this.state.isConnected ? "status-critical" : "status-unknown"} />
                          </Box>
                          <Box direction="row" justify="center">
                            <Box id="0" margin="small" pad="medium" background="#313131"><Trigger size="medium" color={this.state.isConnected ? "brand" : "status-unknown"} /></Box>
                          </Box>
                          <Box direction="row">
                            <Box id="3" margin="small" pad="medium" background={this.state.isConnected ? "status-ok" : "status-unknown"} />
                            <Box id="8" margin="small" pad="medium" background="none" />
                            <Box id="4" margin="small" pad="medium" background={this.state.isConnected ? "status-ok" : "status-unknown"} />
                          </Box>
                        </Box>
                      </Stack>
                    </Box>
                  </StyledCard>
                </Box>
              </Tab>
              <Tab title="Log" icon={<DocumentTest />} />
              <Tab title="Settings" plain={false} disabled={false} icon={<Configure />}>
                <TabSettings onPreferenceUpdate={this.handlePreferenceUpdate}/>
              </Tab>
            </Tabs>
          </Box>
        </Box>
      </Grommet>
    )
  }
}

export default App;