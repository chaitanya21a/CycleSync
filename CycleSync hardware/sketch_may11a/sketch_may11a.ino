#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <ArduinoJson.h>
#include "time.h"

// Wi-Fi Credentials
#define WIFI_SSID "JioFiber-403"
#define WIFI_PASSWORD "Tanya@403"

// Firebase Configs (Clean URL Format - No https:// and No trailing slash)
#define FIREBASE_HOST "cycle-sync-project-default-rtdb.asia-southeast1.firebasedatabase.app" 
#define FIREBASE_AUTH "bHffjgyFalkkAukOQusFMZKniPEkDhUw0y0ewhJP"

#define BICYCLE_ID "BIKE_01"

// NTP Server Settings for IST
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 19800; 
const int   daylightOffset_sec = 0;

// Hardware Pins Mapping
#define SS_PIN        21
#define RST_PIN       22
#define BUZZER        13
#define SOLENOID_PIN   2  

// OLED Display Configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define I2C_SDA       25
#define I2C_SCL       26

MFRC522 mfrc522(SS_PIN, RST_PIN);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

unsigned long lastScanTime = 0;
const unsigned long scanCooldown = 4000; 

void updateDisplay(String title, String msg) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(title);
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);
  display.setCursor(0, 20);
  display.setTextSize(2);
  display.println(msg);
  display.display();
}
// void updateDisplay(String title, String msg) {
//   display.clearDisplay();
//   display.setTextSize(2);
//   display.setTextColor(SSD1306_WHITE);
//   display.setCursor(0, 0);
//   display.println(title);
//   display.drawLine(0, 10, 128, 10, SSD1306_WHITE);
  
//   display.setCursor(0, 18);
//   // Agar message bada hai toh size 1 karega, nahi toh default 2 rakhega
//   if (msg.length() > 12 || msg.indexOf('\n') != -1 && msg.substring(msg.indexOf('\n')).length() > 10) {
//     display.setTextSize(1); 
//   } else {
//     display.setTextSize(2); 
//   }
  
//   display.println(msg);
//   display.display();
// }
String getFormattedTime() {
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    return "Unknown Time";
  }
  char timeStringBuff[50];
  strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(timeStringBuff);
}

void triggerErrorBuzzer() {
  for(int i = 0; i < 3; i++){
    digitalWrite(BUZZER, HIGH); delay(150);
    digitalWrite(BUZZER, LOW); delay(100);
  }
}

void triggerSuccessBuzzer() {
  digitalWrite(BUZZER, HIGH); delay(200); 
  digitalWrite(BUZZER, LOW);
}

void setup() {
  Serial.begin(115200);
  
  pinMode(BUZZER, OUTPUT);
  pinMode(SOLENOID_PIN, OUTPUT);
  digitalWrite(SOLENOID_PIN, LOW); 

  Wire.begin(I2C_SDA, I2C_SCL);
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    Serial.println(F("OLED Allocation Failed"));
    for(;;);
  }
  
  updateDisplay("CYCLESYNC", "BOOTING...\nCONNECTING");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  SPI.begin();
  mfrc522.PCD_Init();
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);

  updateDisplay("CYCLESYNC", "READY\nSCAN CARD");
}

void loop() {
  if ( ! mfrc522.PICC_IsNewCardPresent() || ! mfrc522.PICC_ReadCardSerial() ) {
    return;
  }

  if (millis() - lastScanTime < scanCooldown) {
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    return; 
  }

  String readUID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    readUID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    readUID += String(mfrc522.uid.uidByte[i], HEX);
  }
  readUID.toUpperCase();
  
  lastScanTime = millis(); 
  
  Serial.println("Scanned UID: " + readUID);
  updateDisplay("CYCLESYNC", "VERIFYING\nDATA...");

  String studentPath = "/students/" + readUID;
  String logPath = "/usage_logs/" + readUID; 

  if (Firebase.ready()) {
    // Step 1: Check if Student Exists & is Allowed
    if (Firebase.getBool(firebaseData, studentPath + "/isAllowed")) {
      bool isAllowed = firebaseData.boolData();
      
      // ==================== DYNAMIC NAME FETCH ====================
      String studentName = "STUDENT"; 
      if (Firebase.getString(firebaseData, studentPath + "/name")) {
        studentName = firebaseData.stringData();
        studentName.toUpperCase(); 
      }
      // ============================================================

      // Check for Banned Status
      Firebase.getBool(firebaseData, studentPath + "/isBanned");
      bool isBanned = firebaseData.boolData();

      // Check for Fine Status
      Firebase.getBool(firebaseData, studentPath + "/hasFine");
      bool hasFine = firebaseData.boolData();

      if (!isAllowed || isBanned) {
        updateDisplay(studentName, "BLOCKED OR\nBANNED!");
        triggerErrorBuzzer();
      } 
      else if (hasFine) {
        updateDisplay(studentName, "PAY YOUR\nFINE FIRST");
        triggerErrorBuzzer();
      } 
      else {
        // Step 2: Check current riding state under the specific Card UID node
        bool isRiding = false;
        if (Firebase.getBool(firebaseData, logPath + "/isRiding")) {
          isRiding = firebaseData.boolData();
        }

        String currentTime = getFormattedTime();

        if (!isRiding) {
          // ==================== SCAN 1: UNLOCK & START RIDE ====================
          updateDisplay("HI " + studentName, "UNLOCKING\nCYCLE...");
          
          triggerSuccessBuzzer();
          digitalWrite(SOLENOID_PIN, HIGH); 
          delay(2500);                      
          digitalWrite(SOLENOID_PIN, LOW);  

          FirebaseJson logData;
          logData.set("startTime", currentTime);
          logData.set("endTime", "Active...");
          logData.set("bicycleId", BICYCLE_ID);
          logData.set("durationMinutes", 0); 

          if (Firebase.pushJSON(firebaseData, logPath + "/history", logData)) {
            String generatedSessionKey = firebaseData.pushName();
            
            Firebase.setString(firebaseData, logPath + "/currentSessionKey", generatedSessionKey);
            Firebase.setBool(firebaseData, logPath + "/isRiding", true);
            Firebase.setString(firebaseData, logPath + "/last_session_id", generatedSessionKey);
            
            updateDisplay(studentName, "RIDE STARTED\nHAVE A SAFE ONE");
          }
        } 
        else {
          // ==================== SCAN 2: LOCK & END RIDE ====================
          updateDisplay("BYE " + studentName, "RETURNING\nCYCLE...");
          
          String activeSessionKey = "";
          if (Firebase.getString(firebaseData, logPath + "/currentSessionKey")) {
            activeSessionKey = firebaseData.stringData();
          }

          if (activeSessionKey != "") {
            digitalWrite(SOLENOID_PIN, HIGH);
            digitalWrite(BUZZER, HIGH); delay(100); digitalWrite(BUZZER, LOW); delay(100);
            digitalWrite(BUZZER, HIGH); delay(100); digitalWrite(BUZZER, LOW);
            delay(2500); 
            digitalWrite(SOLENOID_PIN, LOW);

            Firebase.setString(firebaseData, logPath + "/history/" + activeSessionKey + "/endTime", currentTime);
            Firebase.setBool(firebaseData, logPath + "/isRiding", false);
            Firebase.setString(firebaseData, logPath + "/currentSessionKey", "");

            int totalRides = 0;
            if(Firebase.getInt(firebaseData, studentPath + "/totalRides")) {
              totalRides = firebaseData.intData();
              Firebase.setInt(firebaseData, studentPath + "/totalRides", totalRides + 1);
            }

            updateDisplay("SUCCESS", "RETURNED\nTHANK YOU!");
          } else {
            updateDisplay("ERROR", "SESSION KEY\nMISSING");
            triggerErrorBuzzer();
          }
        }
      }
    } 
    else {
      updateDisplay("DENIED", "UNKNOWN\nCARD ID");
      triggerErrorBuzzer();
    }
  } 
  else {
    updateDisplay("ERROR", "DATABASE\nOFFLINE");
    triggerErrorBuzzer();
  }

  delay(1500); 
  updateDisplay("CYCLESYNC", "READY\nSCAN CARD");
  
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}