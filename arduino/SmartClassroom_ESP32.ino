This is my arduino code:

#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>

// DHT22 Setup
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// BH1750 Setup
BH1750 lightMeter;

// MQ135 Setup
#define MQ135_PIN 34

// Sound Sensor
#define MIC_PIN 33
int lastSoundValue = -1;
int soundThreshold = 10;

// Setup 
void setup() {
  Serial.begin(115200);
  Serial.println("Starting ESP32 Multi-Sensor System...");
  delay(1000);

  // Initialize DHT22
  dht.begin();

  //Initialize I2C for BH1750
  Wire.begin(21, 22);      // SDA = 21, SCL = 22
  if (lightMeter.begin()) {
    Serial.println("BH1750 initialized.");
  } else {
    Serial.println("BH1750 ERROR – check SDA/SCL wiring.");
  }

  // Initialize MIC sensor
  pinMode(MIC_PIN, INPUT);

  Serial.println("MQ135 Ready.");
  Serial.println("Loudness Sensor Ready.");
  Serial.println("System Fully Initialized.\n");
}

// Main Loop
void loop() {

  // Read DHT22
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read DHT22!");
  }

  // Read BH1750
  float lux = lightMeter.readLightLevel();  // returns lux

  // Read Sound Sensor
  int soundRaw = analogRead(MIC_PIN);

  // Check for sound sensor issues (e.g., constant zero value)
  if (soundRaw == 0) {
    if (lastSoundValue == 0) {
      Serial.println("Sound sensor might not be connected properly or is malfunctioning.");
    }
  } else {
    lastSoundValue = soundRaw;
  }

  // Read MQ135 Gas Sensor
  int gasRaw = analogRead(MQ135_PIN);

  // Print Output
  Serial.println("===== SENSOR READINGS =====");

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("Light: ");
  Serial.print(lux);
  Serial.println(" lux");

  Serial.print("Sound: ");
  Serial.println(soundRaw);

  Serial.print("MQ135 Gas: ");
  Serial.println(gasRaw);

  Serial.println("============================\n");

  delay(3000);
}

