# 🚀 Trust Aware Smart Attendance System (TASAS)



**Secure • Intelligent • Cloud Connected • IoT Powered**

</p>

---

## 📖 Overview

**Trust Aware Smart Attendance System (TASAS)** is an IoT-powered attendance management solution designed to modernize traditional attendance systems through secure RFID authentication, cloud synchronization, and an interactive web dashboard.

The system combines embedded hardware with cloud technologies to automate attendance recording while providing administrators with real-time attendance analytics.

Attendance data is securely transmitted to **Firebase Firestore**, where it becomes instantly available through a responsive web dashboard.

---

# ✨ Features

- 🔐 RFID-based contactless attendance
- ☁️ Real-time Firebase Firestore synchronization
- 📊 Web-based attendance analytics dashboard
- 👤 UID-based student verification
- 📺 OLED display for live user feedback
- 🔔 Audio feedback using buzzer
- 🕒 Automatic date & time synchronization via NTP
- 📈 Simulated Trust Score verification workflow
- ⚡ Lightweight and scalable architecture

---

# 🛠 Tech Stack

## Hardware

- ESP32-CAM
- MFRC522 RFID Reader
- SSD1306 OLED Display
- Active Buzzer

## Software

- Arduino IDE
- HTML5
- CSS3
- JavaScript
- Firebase Firestore
- Tailwind CSS
- Chart.js

---

# ⚙️ Hardware Components

| Component | Purpose |
|-----------|----------|
| ESP32-CAM | Main microcontroller |
| MFRC522 | RFID authentication |
| SSD1306 OLED | User interface |
| Active Buzzer | Audio notification |
| Breadboard & Jumper Wires | Prototype implementation |

---

# 🔄 System Workflow

```text
Power ON
      │
      ▼
Connect WiFi
      │
      ▼
Synchronize Time (NTP)
      │
      ▼
Tap RFID Card
      │
      ▼
Verify UID
      │
 ┌────┴────┐
 │         │
Valid    Invalid
 │         │
 ▼         ▼
Display   Access
Success   Denied
 │
 ▼
Simulated Trust Verification
 │
 ▼
Generate Trust Score
 │
 ▼
Upload Attendance to Firebase
 │
 ▼
Dashboard Updates in Real-Time
```

---

# 📊 Dashboard Features

- Attendance Overview
- Student Statistics
- Subject-wise Analytics
- Trust Score Visualization
- Attendance History
- Firebase Cloud Synchronization

---

# 📁 Project Structure

```
TASAS
│
├── ESP32/
│   └── tasas.ino
│
├── Dashboard/
│   ├── index.html
│   ├── dashboard.html
│   ├── app.js
│   ├── firebaseConfig.js
│   └── styles.css
│
├── assets/
│   ├── login.png
│   ├── dashboard.png
│   ├── hardware.jpg
│   └── architecture.png
│
└── README.md
```

---

# 🚀 Installation

## ESP32

1. Install Arduino IDE
2. Install ESP32 Board Package
3. Install libraries

- MFRC522
- Adafruit SSD1306
- Adafruit GFX
- WiFi
- HTTPClient

4. Configure WiFi credentials

```cpp
const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
```

5. Configure Firebase

```cpp
const String FIREBASE_PROJECT_ID = "YOUR_PROJECT";
```

6. Upload the code.

---

# 🌐 Dashboard Setup

1. Clone the repository

```
git clone https://github.com/franklingeezer/tasas.git
```

2. Configure Firebase.

3. Open

```
index.html
```

or deploy using Firebase Hosting.

---


# 📚 Project Report

The complete project documentation is included in this repository.

It covers:

- Problem Statement
- Literature Review
- Methodology
- System Design
- Database Design
- Implementation
- Testing
- Results
- Future Work

---

# 🔮 Future Improvements

- AI Face Recognition
- Anti-Spoof Detection
- Mobile Application
- Offline Attendance Cache
- Multi-factor Authentication
- Role-based Access Control
- Advanced Trust Score Algorithm

---

# 👨‍💻 Team

- **Md. Omar Faruk**
- **Md. Sadman Hafiz**
- **Md. Farhan Tanvir**
- **Rahela Khan**

---

# 🙏 Acknowledgements

Department of Computer Science & Engineering  
Daffodil International University

---

# ⭐ Support

If you found this project useful, consider giving the repository a ⭐.

It helps others discover the project and motivates future improvements.
