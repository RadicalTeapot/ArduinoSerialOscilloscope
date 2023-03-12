#include <Arduino.h>

const size_t headerSize = 4;
const uint8_t header[headerSize] = {0x00, 0xFF, 0x00, 0xFF};

const size_t pinCount = 6;
const uint8_t pins[pinCount] = {A0, A1, A2, A3, A4, A5};
const uint8_t maxStep = pinCount + headerSize;

uint8_t step = 0;
byte readByte = 0;

void setup()
{
    Serial.begin(9600); // 1.2 kB/s max useful might be lower if using parity bytes and stop byte
}

byte getSendByte() {
    if (step < headerSize)
    {
        return header[step];
    }
    else
    {
#ifdef EMU
        return random(0xFF);
#else
        int readValue = analogRead(pins[step - headerSize]);
        float value = static_cast<float>(readValue) / 1024.0f;
        return static_cast<uint8_t>(value * 0xFF);
#endif
    }
}

void loop()
{
    // TODO Could use some kind of hysteresis for readByte to lower noise to signal ratio
    readByte = getSendByte();   // Always re-read on purpose to thrash bad values while waiting for serial to be ready
    if (Serial.availableForWrite() > 0)
    {
        Serial.write(readByte);
        step = (step + 1) % maxStep;
    }
}
