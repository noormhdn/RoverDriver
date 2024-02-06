import React from 'react';
import { Collapsible, Box, Diagram, Stack, Button, RangeInput, Image, Distribution, Text, Table, TableHeader, TableRow, TableCell, TableBody, ResponsiveContext, Heading, Menu, RadioButtonGroup, TextInput, Form, FormField, Tab, Tabs } from "grommet";
import { SettingsGroup, StyledCard } from "./CommonUI";
import { Trigger, Halt, Power, Add, Subtract, CaretUp, CaretDown, CaretNext, CaretPrevious, StatusCritical } from 'grommet-icons'
import ls from 'local-storage'

import wasdDark from './wasd-dark.png';
import arrowDark from './arrow-dark.png';
import wasdLight from './wasd-light.png';
import arrowLight from './arrow-light.png';
import escDark from './esc-dark.png';
import escLight from './esc-light.png';

const value = '';

class TabDrive extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            lightMode: false,
            value: '',
            straightSpeed: '',
            motionDirection: '',
            turnSpeed: '',
            turnRadius: '',
            turnDirection: '',
            pointSpeed: '',
            pointDirection: '',
            sunkManeuver: ''
        };
        this.handleDriveStart = this.handleDriveStart.bind(this);
        this.handleDriveStop = this.handleDriveStop.bind(this);
        this.handleSpeedChange = this.handleSpeedChange.bind(this);
        this.defaultValue = {
            straightSpeed: '',
            turnSpeed: '',
            turnRadius: '',
            pointSpeed: ''
        };
        this.commandedValue = { // May be deleted?
            straightSpeed: '',
            turnSpeed: '',
            turnRadius: '',
            pointSpeed: ''
        };
        /*this.onChange = this.onChange.bind(this);*/
        this.handleCommandChange = this.handleCommandChange.bind(this);
    }

    componentDidMount() {

    }

    handleDriveStart() {
        if (this.props.isConnected === true) {
            this.props.rover.queueSubject(0xC1);
        }
    }

    handleDriveStop() {
        if (this.props.isConnected === true) {
            this.props.rover.queueSubject(0xC0);
        }
    }

    handleSpeedChange(event, speed, preventDefault = true) {
        if (preventDefault) event.preventDefault();
        if (this.props.isConnected === true) {
            if (speed < 1) {
                speed = 1;
            } else if (speed > 10) {
                speed = 10;
            }
            this.props.rover.queueMessage(0xCE, speed);
        }
        if (ls.get('vibrate') !== null ? ls.get('vibrate') : true) {
            window.navigator.vibrate(5);
        };
    }

    handleDPad = (event, keycode, preventDefault = true) => {
        if (preventDefault) event.preventDefault();
        if (keycode) {
            this.props.rover.queueKey(0xCA, keycode);
            if (parseInt(keycode) % 10 === 1 && (ls.get('vibrate') !== null ? ls.get('vibrate') : true)) {
                window.navigator.vibrate(5);
            };
        }
    }

    clearControllerError = (event, keycode) => {
        event.preventDefault();
        this.props.rover.queueMessage(keycode, 0x00);
    }

    logs = () => {
        console.log(this.state.straightSpeed);
        console.log(this.state.turnSpeed);
        console.log(this.state.turnRadius);
    }

    handleManeuver = (event, manCode, preventDefault = true) => {
        let spLimit = 30; //set the upper limit of the speed in cm/s to avoid hardware damage
        let tuLimit = 20; //set the lower limit of the turn radius in cm to avoid hardware damage
        if (preventDefault) event.preventDefault();
        switch (manCode) {
            case 0xE0: //Straight Driving
                //this.props.rover.queueMessage(0xE0, this.state.straightSpeed);
                let stSpeed = this.state.straightSpeed;
                if (stSpeed.length > 4) { alert("Speed input cannot exceed 4 digits. Please reset the inputs.") }
                else if (Math.abs(stSpeed) > spLimit) { alert("Speed input cannot exceed " + spLimit + " cm/s. Please reset the inputs.") }
                else {
                    this.props.rover.queueMessage(0xE0, stSpeed);
                    console.log("Straight drive maneuver commanded");
                    console.log(this.state.straightSpeed);
                    console.log(stSpeed);
                }
                break;
            case 0xE1: //Turn
                let tuSpeed = this.state.turnSpeed;
                let tuRadius = this.state.turnRadius;
                let tuDirection = this.state.turnDirection;
                if (tuDirection == "Right turn") { tuDirection = "R" }
                else if (tuDirection == "Left turn") { tuDirection = "L" }
                else {console.log("Please select a turn direction")}
                //setting the boundaries for user input commands to avoid software bugs or hardware limits
                if (tuSpeed.length > 4) { alert("Speed input cannot exceed 4 digits. Please reset the inputs.")}
                else if (Math.abs(tuSpeed) > spLimit) { alert("Speed input cannot exceed " + spLimit + " cm/s. Please reset the inputs.")}
                else if (tuRadius.length > 4) { alert("Turn radius input cannot exceed 4 digits. Please reset the inputs.") }
                else if (tuRadius < tuLimit) { alert("Turn radius input cannot be below " + tuLimit + " cm. Please reset the inputs.") }
                else {
                    let placeHolder = 0;
                    placeHolder = 4 - tuSpeed.length;
                    for (let i = 1; i <= placeHolder; i++) {
                        tuSpeed = (tuSpeed + "x");
                    }
                    placeHolder = 4 - tuRadius.length;
                    for (let i = 1; i <= placeHolder; i++) {
                        tuRadius = (tuRadius + "x");
                    }
                    console.log("Turn drive maneuver commanded");
                    console.log(this.state.turnSpeed);
                    console.log(tuSpeed);
                    console.log(this.state.turnRadius);
                    console.log(tuRadius);
                    console.log(tuDirection);
                    let cmd = (tuSpeed + tuRadius + tuDirection);
                    console.log(cmd)
                    this.props.rover.queueMessage(0xE1, cmd);
                };
                break;
            case 0xE2: //Point Turn
                let ptSpeed = this.state.pointSpeed;
                let ptDirection = this.state.pointDirection;
                if (ptDirection == "Right turn") { ptDirection = "R" }
                else if (ptDirection == "Left turn") { ptDirection = "L" }
                else { console.log("Please select a turn direction") }
                //setting the boundaries for user input commands to avoid software bugs or hardware limits
                if (ptSpeed.length > 4) { alert("Speed input cannot exceed 4 digits. Please reset the inputs.") }
                else if (Math.abs(ptSpeed) > spLimit) { alert("Speed input cannot exceed " + spLimit + " cm/s. Please reset the inputs.") }
                else {
                    let placeHolder = 0;
                    placeHolder = 4 - ptSpeed.length;
                    for (let i = 1; i <= placeHolder; i++) {
                        ptSpeed = (ptSpeed + "x");
                    }
                    console.log("Point turn maneuver commanded");
                    console.log(this.state.pointSpeed);
                    console.log(ptSpeed);
                    console.log(ptDirection);
                    let cmd = (ptSpeed + ptDirection);
                    console.log(cmd)
                    this.props.rover.queueMessage(0xE2, cmd);
                };
                break;
            case 0xE3: //Sunken Wheel
                let skManeuver = this.state.sunkManeuver;
                switch (skManeuver) {
                    case "Maneuver 1":
                        skManeuver = "1"
                        break;
                    case "Maneuver 2":
                        skManeuver = "2"
                        break;
                    case "Maneuver 3":
                        skManeuver = "3"
                        break;
                    case "Maneuver 4":
                        skManeuver = "4"
                        break;
                    default:
                        { console.log("Please select a maneuver") }
                        break;
                }
                console.log("Sunken wheel maneuver commanded");
                console.log(this.state.sunkManeuver);
                console.log(skManeuver);
                let cmd = (skManeuver);
                console.log(cmd)
                this.props.rover.queueMessage(0xE3, cmd);
                break;
            default:
                console.log("Maneuver command error");
                break;
        }
    }

    handleCommandChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    render() {
        return <Box justify="center" pad={{ "top": "none", "bottom": "small", "left": "small", "right": "small" }} className="tabContents" animation={{ "type": "fadeIn", "size": "small" }} direction="row" align="stretch" fill hoverIndicator={false}>
            <StyledCard title="Controller State" centered wide>
                <ResponsiveContext.Consumer>
                    {size => (
                        <Box align="center" justify="around" margin={{ "bottom": "small" }} direction="row" wrap={true}>
                            <ControllerDiagram isConnected={this.props.isConnected} roverController={this.props.roverController} />
                            <Box align="start" justify="around" direction="column" wrap={true}>
                                {((this.props.roverController.FR && this.props.roverController.FR.error && this.props.roverController.FR.error !== "Offline") ||
                                    (this.props.roverController.FL && this.props.roverController.FL.error && this.props.roverController.FL.error !== "Offline") ||
                                    (this.props.roverController.RR && this.props.roverController.RR.error && this.props.roverController.RR.error !== "Offline") ||
                                    (this.props.roverController.RL && this.props.roverController.RL.error && this.props.roverController.RL.error !== "Offline")
                                ) && <>
                                        <Heading level={6} margin="xsmall">Clear halting errors:</Heading>
                                        <Box align="start" margin={{"botton": "small"}} justify="evenly" direction="row" wrap={true}>
                                            {this.props.roverController.FR && this.props.roverController.FR.error && this.props.roverController.FR.error !== "Offline" && <Button label="Front R" onClick={(event) => this.clearControllerError(event, 0xD1)} icon={<StatusCritical />} />}
                                            {this.props.roverController.FL && this.props.roverController.FL.error && this.props.roverController.FL.error !== "Offline" && <Button label="Front L" onClick={(event) => this.clearControllerError(event, 0xD2)} icon={<StatusCritical />} />}
                                            {this.props.roverController.RR && this.props.roverController.RR.error && this.props.roverController.RR.error !== "Offline" && <Button label="Rear R" onClick={(event) => this.clearControllerError(event, 0xD3)} icon={<StatusCritical />} />}
                                            {this.props.roverController.RL && this.props.roverController.RL.error && this.props.roverController.RL.error !== "Offline" && <Button label="Rear L" onClick={(event) => this.clearControllerError(event, 0xD4)} icon={<StatusCritical />} />}
                                        </Box>
                                    </>}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell scope="col" border="bottom"></TableCell>
                                            <TableCell scope="col" border="bottom">Status</TableCell>
                                            {(size !== "small" && size !== "xsmall" && <>
                                                <TableCell scope="col" border="bottom">VIN</TableCell>
                                                <TableCell scope="col" border="bottom">Current</TableCell>
                                                <TableCell scope="col" border="bottom">Target Cycle</TableCell>
                                                <TableCell scope="col" border="bottom">Cycle</TableCell>
                                            </>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell scope="row" background={(this.props.roverController.FR && this.props.roverController.FR.error) ? "status-critical" : "none"}>
                                                <strong>Front R</strong>
                                            </TableCell>
                                            <TableCell background={(this.props.roverController.FR && this.props.roverController.FR.error) ? "status-critical" : "none"}>
                                                <strong>{this.props.roverController.FR ? (this.props.roverController.FR.error ? this.props.roverController.FR.error : "OK") : "-"}</strong>
                                            </TableCell>
                                            {(size !== "small" && size !== "xsmall" && <>
                                                <TableCell>{this.props.roverController.FR && this.props.roverController.FR.voltage ? (Math.round(this.props.roverController.FR.voltage * 100) / 100).toFixed(1) : "-"} V</TableCell>
                                                <TableCell>{this.props.roverController.FR && this.props.roverController.FR.current ? this.props.roverController.FR.current : "-"} mA</TableCell>
                                                <TableCell>{this.props.roverController.FR && this.props.roverController.FR.dutyCycleTarget ? this.props.roverController.FR.dutyCycleTarget : "-"}</TableCell>
                                                <TableCell>{this.props.roverController.FR && this.props.roverController.FR.dutyCycle ? this.props.roverController.FR.dutyCycle : "-"}</TableCell>
                                            </>)}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell scope="row" background={(this.props.roverController.FL && this.props.roverController.FL.error) ? "status-critical" : "none"}>
                                                <strong>Front L</strong>
                                            </TableCell>
                                            <TableCell background={(this.props.roverController.FL && this.props.roverController.FL.error) ? "status-critical" : "none"}>
                                                <strong>{this.props.roverController.FL ? (this.props.roverController.FL.error ? this.props.roverController.FL.error : "OK") : "-"}</strong>
                                            </TableCell>
                                            {(size !== "small" && size !== "xsmall" && <>
                                                <TableCell>{this.props.roverController.FL && this.props.roverController.FL.voltage ? (Math.round(this.props.roverController.FL.voltage * 100) / 100).toFixed(1) : "-"} V</TableCell>
                                                <TableCell>{this.props.roverController.FL && this.props.roverController.FL.current ? this.props.roverController.FL.current : "-"} mA</TableCell>
                                                <TableCell>{this.props.roverController.FL && this.props.roverController.FL.dutyCycleTarget ? this.props.roverController.FL.dutyCycleTarget : "-"}</TableCell>
                                                <TableCell>{this.props.roverController.FL && this.props.roverController.FL.dutyCycle ? this.props.roverController.FL.dutyCycle : "-"}</TableCell>
                                            </>)}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell scope="row" background={(this.props.roverController.RR && this.props.roverController.RR.error) ? "status-critical" : "none"}>
                                                <strong>Rear R</strong>
                                            </TableCell>
                                            <TableCell background={(this.props.roverController.RR && this.props.roverController.RR.error) ? "status-critical" : "none"}>
                                                <strong>{this.props.roverController.RR ? (this.props.roverController.RR.error ? this.props.roverController.RR.error : "OK") : "-"}</strong>
                                            </TableCell>
                                            {(size !== "small" && size !== "xsmall" && <>
                                                <TableCell>{this.props.roverController.RR && this.props.roverController.RR.voltage ? (Math.round(this.props.roverController.RR.voltage * 100) / 100).toFixed(1) : "-"} V</TableCell>
                                                <TableCell>{this.props.roverController.RR && this.props.roverController.RR.current ? this.props.roverController.RR.current : "-"} mA</TableCell>
                                                <TableCell>{this.props.roverController.RR && this.props.roverController.RR.dutyCycleTarget ? this.props.roverController.RR.dutyCycleTarget : "-"}</TableCell>
                                                <TableCell>{this.props.roverController.RR && this.props.roverController.RR.dutyCycle ? this.props.roverController.RR.dutyCycle : "-"}</TableCell>
                                            </>)}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell scope="row" background={(this.props.roverController.RL && this.props.roverController.RL.error) ? "status-critical" : "none"}>
                                                <strong>Rear L</strong>
                                            </TableCell>
                                            <TableCell background={(this.props.roverController.RL && this.props.roverController.RL.error) ? "status-critical" : "none"}>
                                                <strong>{this.props.roverController.RL ? (this.props.roverController.RL.error ? this.props.roverController.RL.error : "OK") : "-"}</strong>
                                            </TableCell>
                                            {(size !== "small" && size !== "xsmall" && <>
                                                <TableCell>{this.props.roverController.RL && this.props.roverController.RL.voltage ? (Math.round(this.props.roverController.RL.voltage * 100) / 100).toFixed(1) : "-"} V</TableCell>
                                                <TableCell>{this.props.roverController.RL && this.props.roverController.RL.current ? this.props.roverController.RL.current : "-"} mA</TableCell>
                                                <TableCell>{this.props.roverController.RL && this.props.roverController.RL.dutyCycleTarget ? this.props.roverController.RL.dutyCycleTarget : "-"}</TableCell>
                                                <TableCell>{this.props.roverController.RL && this.props.roverController.RL.dutyCycle ? this.props.roverController.RL.dutyCycle : "-"}</TableCell>
                                            </>)}
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Box>
                        </Box>
                    )}

                </ResponsiveContext.Consumer>
            </StyledCard>
            <StyledCard title="Driving Maneuvers" wide>
                <Button margin={{ "top": "small", "bottom": "small", "left": "none", "right": "none" }} label="STOP MOTORS" color="status-critical" onClick={this.handleDriveStop} icon={<Halt />} primary />
                <Box justify="center" >
                    <Box gap="small" alignContent="center" margin={{ "top": "small", "bottom": "small", "left": "small", "right": "medium" }}>
                        <Text textAlign="start">Select Driving Maneuver</Text>
                    </Box>
                </Box>
                <Tabs>
                    <Tab title="Straight Drive">
                        <Form
                            value={this.value}
                            onReset={(event) => {
                                this.setState({
                                    straightSpeed: this.defaultValue.straightSpeed
                                });
                                console.log('Reset', event.value, event.touched)
                            }}
                            onSubmit={(event) => {
                                console.log('Submit', event.value, event.touched)
                                this.logs(event.value)
                                this.handleManeuver(event, 0xE0)
                                }
                            }
                            //onChange={() => this.onChange(this.event.value)}
                        >
                            <FormField label="Enter Speed in cm/s" name="straightSpeed" required>
                                <TextInput
                                    name="straightSpeed"
                                    type="text"
                                    placeholder="Type here!"
                                    value={this.state.straightSpeed}
                                    onChange={this.handleCommandChange}
                                />
                            </FormField>
                            <Box direction="row" justify="between" margin={{ top: 'medium' }}>
                                <Button type="reset" label="Reset" />
                                <Button type="submit" label="Update" primary />
                            </Box>
                        </Form>
                    </Tab>
                    <Tab title="Turn">
                        <Form
                            value={this.value}
                            onReset={(event) => {
                                this.setState({
                                    turnSpeed: this.defaultValue.turnSpeed,
                                    turnRadius: this.defaultValue.turnRadius
                                });
                            }}
                            onSubmit={(event) => {
                                console.log('Submit', event.value, event.touched)
                                this.logs(event.value)
                                this.handleManeuver(event, 0xE1)
                                }
                            }
                        >
                            <FormField label="Enter Average Speed in cm/s" name="turnSpeed" required>
                                <TextInput
                                    name="turnSpeed"
                                    type="text"
                                    placeholder="Type here!"
                                    value={this.state.turnSpeed}
                                    onChange={this.handleCommandChange}
                                />
                            </FormField>
                            <FormField label="Enter Radius of Curvature in cm" name="turnRadius" required>
                                <TextInput
                                    name="turnRadius"
                                    type="text"
                                    placeholder="Type here!"
                                    value={this.state.turnRadius}
                                    onChange={this.handleCommandChange}
                                />
                            </FormField>
                            <FormField name="turnDirection" required>
                                <RadioButtonGroup
                                    name="turnDirection"
                                    options={['Right turn', 'Left turn']}
                                    value={this.state.turnDirection}
                                    onChange={this.handleCommandChange}
                                />
                            </FormField>
                            <Box direction="row" justify="between" margin={{ top: 'medium' }}>
                                <Button type="reset" label="Reset" />
                                <Button type="submit" label="Update" primary />
                            </Box>
                        </Form>
                    </Tab>
                    <Tab title="Point Turn">
                        <Form
                            value={this.value}
                            onReset={(event) => {
                                this.setState({
                                    pointSpeed: this.defaultValue.pointSpeed,
                                    pointDirection: this.defaultValue.pointDirection
                                });
                            }}
                            onSubmit={(event) => {
                                console.log('Submit', event.value, event.touched)
                                this.logs(event.value)
                                this.handleManeuver(event, 0xE2)
                            }
                            }
                        >
                            <FormField label="Enter Speed in cm/s" name="pointSpeed" required>
                                <TextInput
                                    name="pointSpeed"
                                    type="text"
                                    placeholder="Type here!"
                                    value={this.state.pointSpeed}
                                    onChange={this.handleCommandChange}
                                />
                            </FormField>
                            <FormField name="pointDirection" required>
                                <RadioButtonGroup
                                    name="pointDirection"
                                    options={['Right turn', 'Left turn']}
                                    value={this.state.pointDirection}
                                    onChange={this.handleCommandChange}
                                />
                            </FormField>
                            <Box direction="row" justify="between" margin={{ top: 'medium' }}>
                                <Button type="reset" label="Reset" />
                                <Button type="submit" label="Update" primary />
                            </Box>
                        </Form>
                    </Tab>
                    <Tab title="Sunken Wheel">
                        <Form
                            value={this.value}
                            onReset={(event) => {
                                this.setState({
                                });
                            }}
                            onSubmit={(event) => {
                                console.log('Submit', event.value, event.touched)
                                this.logs(event.value)
                                this.handleManeuver(event, 0xE3)
                            }
                            }
                        >
                            <FormField name="sunkManeuver" required>
                                <RadioButtonGroup
                                    name="sunkManeuver"
                                    options={['Maneuver 1', 'Maneuver 2', 'Maneuver 3', 'Maneuver 4']}
                                    value={this.state.sunkManeuver}
                                    onChange={this.handleCommandChange}
                                />
                            </FormField>
                            <Box direction="row" justify="between" margin={{ top: 'medium' }}>
                                <Button type="reset" label="Reset" />
                                <Button type="submit" label="Update" primary />
                            </Box>
                        </Form>
                    </Tab>
                </Tabs>
            </StyledCard>
        </Box>;
    }
}

export default TabDrive;

const ControllerDiagram = (props) => {
    return (
        <Stack guidingChild={1}>
            <Diagram
                connections={[
                    {
                        fromTarget: '1',
                        toTarget: '0',
                        thickness: 'xsmall',
                        color: props.roverController.FL && props.roverController.FL.online !== undefined ? (props.roverController.FL.error ? "accent-1" : "accent-4") : "status-unknown",
                        type: 'curved',
                    },
                    {
                        fromTarget: '2',
                        toTarget: '0',
                        thickness: 'xsmall',
                        color: props.roverController.FR && props.roverController.FR.online !== undefined ? (props.roverController.FR.error ? "accent-1" : "accent-4") : "status-unknown",
                        type: 'curved',
                    },
                    {
                        fromTarget: '3',
                        toTarget: '0',
                        thickness: 'xsmall',
                        color: props.roverController.RL && props.roverController.RL.online !== undefined ? (props.roverController.RL.error ? "accent-1" : "accent-4") : "status-unknown",
                        type: 'curved',
                    },
                    {
                        fromTarget: '4',
                        toTarget: '0',
                        thickness: 'xsmall',
                        color: props.roverController.RR && props.roverController.RR.online !== undefined ? (props.roverController.RR.error ? "accent-1" : "accent-4") : "status-unknown",
                        type: 'curved',
                    }
                ]}
            />
            <Box>
                <Box direction="row">
                    <Box id="1" margin="small" pad="medium" background={props.roverController.FL && props.roverController.FL.online !== undefined ? (props.roverController.FL.error ? "status-critical" : "status-ok") : "status-unknown"} />
                    <Box id="5" margin="small" pad="medium" background="none" />
                    <Box id="2" margin="small" pad="medium" background={props.roverController.FR && props.roverController.FR.online !== undefined ? (props.roverController.FR.error ? "status-critical" : "status-ok") : "status-unknown"} />
                </Box>
                <Box direction="row" justify="center">
                    <Box id="0" margin="small" pad="medium" background="#313131"><Trigger size="medium" color={props.isConnected ? "brand" : "status-unknown"} /></Box>
                </Box>
                <Box direction="row">
                    <Box id="3" margin="small" pad="medium" background={props.roverController.RL && props.roverController.RL.online !== undefined ? (props.roverController.RL.error ? "status-critical" : "status-ok") : "status-unknown"} />
                    <Box id="8" margin="small" pad="medium" background="none" />
                    <Box id="4" margin="small" pad="medium" background={props.roverController.RR && props.roverController.RR.online !== undefined ? (props.roverController.RR.error ? "status-critical" : "status-ok") : "status-unknown"} />
                </Box>
            </Box>
        </Stack>
    )
}

const Bounds = (props) => {
    return (
        <Box direction="row" align="center" gap="small">
            <Button
                className="btouch"
                plain={false}
                disabled={!props.enable || props.value === undefined || isNaN(props.value) || props.value === 0 || props.value === 1}
                icon={<Subtract color="brand" />}
                onClick={() => {
                    //props.setValue(props.value - 1);
                }}
                onMouseDown={(event) => props.setDPad(event, "21")}
                onMouseUp={(event) => props.setDPad(event, false)}
                onMouseLeave={(event) => props.setDPad(event, false)}
                onTouchStart={(event) => props.setDPad(event, "21", false)}
                onTouchEnd={(event) => props.setDPad(event, false)}
            />
            <Box align="center" width="medium">
                <RangeInput
                    min={1}
                    max={10}
                    step={1}
                    // This is disabled because it is too jerky/laggy
                    disabled={true || props.value === undefined || isNaN(props.value) || props.value === 0}
                    value={(props.value === undefined || isNaN(props.value) || props.value === 0) ? 5 : props.value}
                    onChange={event => {
                        props.setValue(false, parseInt(event.target.value), false);
                    }}
                />
            </Box>
            <Button
                className="btouch"
                plain={false}
                disabled={!props.enable || props.value === undefined || isNaN(props.value) || props.value === 0 || props.value === 10}
                icon={<Add color="brand" />}
                onClick={() => {
                    //props.setValue(props.value - 1);
                }}
                onMouseDown={(event) => props.setDPad(event, "11")}
                onMouseUp={(event) => props.setDPad(event, false)}
                onMouseLeave={(event) => props.setDPad(event, false)}
                onTouchStart={(event) => props.setDPad(event, "11", false)}
                onTouchEnd={(event) => props.setDPad(event, false)}
            />
        </Box>
    );
};
