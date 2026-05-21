#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// RFID Pins
#define SS_PIN    21
#define RST_PIN   22
MFRC522 mfrc522(SS_PIN, RST_PIN);

// OLED Settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define I2C_SDA 25
#define I2C_SCL 26
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Output Pins
#define BUZZER    13
#define LED       2

// Replace this with your actual card UID
String masterCard = "8EFFD206"; 

void updateDisplay(String title, String msg) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(title);
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);
  display.setCursor(0, 25);
  display.setTextSize(2);
  display.println(msg);
  display.display();
}

void setup() {
  Serial.begin(115200);
  
  // Custom I2C pins for OLED
  Wire.begin(I2C_SDA, I2C_SCL);
  
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }

  SPI.begin();
  mfrc522.PCD_Init();
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);

  pinMode(BUZZER, OUTPUT);
  pinMode(LED, OUTPUT);

  updateDisplay("RFID SYSTEM", "READY...");
}

void loop() {
  if ( ! mfrc522.PICC_IsNewCardPresent() || ! mfrc522.PICC_ReadCardSerial() ) {
    return;
  }

  String readUID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    readUID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    readUID += String(mfrc522.uid.uidByte[i], HEX);
  }
  readUID.toUpperCase();

  if (readUID == masterCard) {
    updateDisplay("ACCESS", "GRANTED");
    digitalWrite(LED, HIGH);
    digitalWrite(BUZZER, HIGH);
    delay(1500);
    digitalWrite(LED, LOW);
    digitalWrite(BUZZER, LOW);
  } else {
    updateDisplay("ACCESS", "DENIED");
    Serial.print("Unknown Card: "); Serial.println(readUID);
    
    for(int i=0; i<2; i++){
      digitalWrite(BUZZER, HIGH); delay(150);
      digitalWrite(BUZZER, LOW); delay(100);
    }
  }

  delay(500);
  updateDisplay("RFID SYSTEM", "SCAN CARD");
  
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}