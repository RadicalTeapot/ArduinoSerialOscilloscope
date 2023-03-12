# Arduino web oscilloscope

An Arduino based simple oscilloscope running in a web browser and communicating via serial.

## Setup

- Clone repo
- Using vscode with the [PlatformIO](https://platformio.org/) extension installed, open the repo root folder build and upload to Arduino board
- In `web_src` using npm to install packages
- Run `npm run start-https` to run the web server
- Open a web page at `https://localhost:1234`
- Use buttons on web page to connect to arduino port and start reading data

## Notes 

- The Arduino board targeted is an Arduino Uno, change the `platform.io` (or use the extension) to change the board to match yours
- You can build using the `env:emulate` configuration to simulate random data read from the analog pins to test the workflow