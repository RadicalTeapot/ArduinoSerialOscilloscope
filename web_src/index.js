import {PatternBuffer} from './PatternBuffer.js';
import {CircularBuffer} from './CircularBuffer.js';

const headerData = [0x00, 0xFF, 0x00, 0xFF];
const patternLength = 10;

const bufferSize = 600;
const circularBuffers = new Array(6).fill(0).map(_ => new CircularBuffer(bufferSize));
const patternBuffer = new PatternBuffer();

const baudRate = 9600;

let reading = false;

const canvasContainer = document.getElementById("canvas-container");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/** Data for Arduino UNO replace or flesh out implementation better to support other boards */
document.getElementById("usbVendorId").value = 10755;
document.getElementById("usbProductId").value = 67;

document.getElementById("requestPort").onclick = async _ => {
    const port = await navigator.serial.requestPort();
    const { usbVendorId, usbProductId } = port.getInfo();
    document.getElementById("usbVendorId").value = usbVendorId;
    document.getElementById("usbProductId").value = usbProductId;
}

document.getElementById("openPort").onclick = connectToPortAndRead;
document.getElementById("closePort").onclick = closePort;

connectToPortAndRead();

async function connectToPortAndRead() {
    const matchingPort = await getFirstMatchingPort();
    await matchingPort.open({baudRate});
    // console.log(`Port opened`);
    readFromPortAndDraw(matchingPort);
}

async function closePort() {
    reading = false;
}

async function getFirstMatchingPort() {
    const ports = await navigator.serial.getPorts();

    const vendorId = document.getElementById("usbVendorId").value;
    const productId = document.getElementById("usbProductId").value;

    const matching = ports.filter(port => {
        const { usbVendorId, usbProductId } = port.getInfo();
        return usbVendorId == vendorId && usbProductId == productId;
    });

    if (matching.length == 0)
        throw new Error("No matching port found");

    return matching[0];
}

function printPortInfo(port, index) {
    const { usbVendorId, usbProductId } = port.getInfo();
    console.log(`Port ${index} vendorId: ${usbVendorId}, productId: ${usbProductId}`);
}

function readFromPort(port) {
    const reader = port.readable.getReader();
    const timeout = 10;
    reading = true;

    const read = async () => {
        try {
            const { value, done } = await reader.read();
            if (done || !reading) {
                console.log(`Done reading`);
                reader.releaseLock();
                await port.close();
                console.log(`Port closed`);
            }
            else {
                span.innerHTML = value[value.length-1];
                setTimeout(read, timeout);
            }
        } catch (error) {
            reader.releaseLock();
            throw error;
        }
    }

    setTimeout(read, timeout);
}

function updateBuffersFromData(data) {
    patternBuffer.push(data);
    const packetsData = patternBuffer.getMatchingPatternsAndTrim(headerData, patternLength);
    if (packetsData.length > 0) {
        // console.log(`${packetsData.length} packets found`);
        // packetsData.forEach(p =>console.log(p));
        packetsData.forEach(packetData => packetData.forEach((value, i) => circularBuffers[i].enqueue(value)));
    }
    // circularBuffers.forEach(buffer => console.log(buffer.getData()));
}

function drawBuffers() {
    const { width, height } = canvasContainer.getBoundingClientRect();

    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    const graphHeight = height / circularBuffers.length;
    const scale = width / bufferSize;
    circularBuffers.forEach((buffer, i) => {
        ctx.save();
        ctx.strokeStyle = 'white';
        ctx.setTransform(1, 0, 0, 1, 0, i * graphHeight);
        ctx.beginPath();
        ctx.moveTo(0, graphHeight);
        ctx.lineTo(width, graphHeight);
        const data = buffer.getData();
        ctx.moveTo(0, (1 - data[0] / 255) * graphHeight);
        data.slice(1).forEach((value, j) => ctx.lineTo((j + 1) * scale, (1 - value / 255) * graphHeight));
        ctx.stroke();
        ctx.restore();
    });
}

function readFromPortAndDraw(port) {
    const reader = port.readable.getReader();
    const span = document.getElementById("latestValue");
    const timeout = 10;
    reading = true;
    let requestID = 0;

    async function draw() {
        try {
            const { value, done } = await reader.read();
            if (done || !reading) {
                // console.log(`Done reading`);
                reader.releaseLock();
                await port.close();
                // console.log(`Port closed`);
                cancelAnimationFrame(requestID);
                return;
            }
            else {
                updateBuffersFromData(value);
                drawBuffers();
            }
        } catch (error) {
            console.error(error);
            reader.releaseLock();
            await port.close();
            // console.log(`Port closed`);
            cancelAnimationFrame(requestID);
            throw error;
        }

        requestID = requestAnimationFrame(draw);
    }

    requestID = requestAnimationFrame(draw);
}
