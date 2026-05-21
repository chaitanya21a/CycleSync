# 🚴 CycleSync - Complete User Flow Diagram Guide

## How to Create in Excalidraw

This guide provides a structured layout for creating a comprehensive flowchart in Excalidraw.
Copy this structure and recreate it visually in Excalidraw.

---

## 📐 Layout Structure

### Color Coding:
- **🟦 Blue (#00D4FF)**: Main user actions
- **🟩 Green (#10B981)**: Success states
- **🟥 Red (#EF4444)**: Error/Fine states
- **🟨 Yellow (#F59E0B)**: Warning/Validation
- **🟪 Purple (#7C3AED)**: Admin actions
- **⚪ White**: Decision points (diamonds)

---

## 🎯 MAIN USER JOURNEY

### 1. APP ENTRY POINT
```
┌─────────────────────┐
│   Open CycleSync    │
│       App           │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │ Has Account? │ (Diamond)
    └──┬────────┬──┘
       │        │
    NO │        │ YES
       │        │
       ▼        ▼
```


### 2. AUTHENTICATION FLOW

#### A. SIGNUP PATH (Left Branch)
```
┌─────────────────────┐
│   Signup Screen     │ 🟦
├─────────────────────┤
│ • Name              │
│ • Email (.edu)      │
│ • Student ID        │
│ • Phone             │
│ • Password          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Validate Email      │ 🟨
│ (.edu or .ac.in)    │
└──────┬──────────────┘
       │
    Valid?
       │
   YES │        NO
       │         └──→ [Show Error: Invalid Email]
       ▼
┌─────────────────────┐
│  Create Account     │ 🟩
│  Auto Login         │
└──────────┬──────────┘
           │
           └──────────┐
                      │
```

#### B. LOGIN PATH (Right Branch)
```
┌─────────────────────┐
│   Login Screen      │ 🟦
├─────────────────────┤
│ • Email             │
│ • Password          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Validate            │ 🟨
│ Credentials         │
└──────┬──────────────┘
       │
    Valid?
       │
   YES │        NO
       │         └──→ [Show Error: Invalid Credentials]
       ▼
┌─────────────────────┐
│ Check User Role     │
└──────┬──────────────┘
       │
       ├──────────────┐
       │              │
   Admin?         User?
       │              │
       ▼              ▼
```


### 3. USER DASHBOARD (Main Hub)
```
┌─────────────────────────────────────────────────┐
│          USER HOME DASHBOARD 🟦                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Stats:                                      │
│  • Available Bikes: 72/100                      │
│  • Daily Usage: 15/60 min                       │
│  • Total Rides: 23                              │
│  • Pending Fines: ₹150                          │
│                                                 │
│  🎯 Quick Actions:                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ SCAN │ │ MAP  │ │HISTORY│ │FINES │          │
│  └───┬──┘ └───┬──┘ └───┬───┘ └───┬──┘          │
└──────┼────────┼────────┼─────────┼──────────────┘
       │        │        │         │
       │        │        │         │
       ▼        ▼        ▼         ▼
```

---

## 🔍 SCAN & RENT BICYCLE FLOW

### 4. QR SCANNING PROCESS
```
┌─────────────────────┐
│   Tap "SCAN"        │ 🟦
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Request Camera      │ 🟨
│ Permission          │
└──────┬──────────────┘
       │
   Granted?
       │
   YES │        NO
       │         └──→ [Show: Manual Entry Option]
       ▼
┌─────────────────────┐
│ Open Camera View    │ 🟦
├─────────────────────┤
│ • QR Scanner Active │
│ • Manual Entry      │
│ • Quick Select      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Scan QR Code        │
│ (CS-XXX-XXXXXX)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Validate Bicycle    │ 🟨
└──────┬──────────────┘
       │
       ├─→ No Active Ride? ──NO──→ [Error: End current ride first]
       │
       ├─→ Daily Limit OK? ──NO──→ [Error: 60 min limit reached]
       │
       ├─→ Bike Available? ──NO──→ [Error: Bike in use/maintenance]
       │
      YES (All checks pass)
       │
       ▼
┌─────────────────────┐
│  START RIDE 🟩      │
│  Unlock Bicycle     │
└──────────┬──────────┘
           │
           ▼
```


### 5. ACTIVE RIDE SCREEN
```
┌─────────────────────────────────────────────────┐
│          ACTIVE RIDE SCREEN 🟦                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  🚴 Bicycle: CS-001-A7K9M2                      │
│  🔓 Status: Unlocked                            │
│                                                 │
│  ⏱️  TIMER (Countdown from 20:00)               │
│  ┌─────────────────┐                           │
│  │   REMAINING     │                           │
│  │     18:45       │                           │
│  │  2 min elapsed  │                           │
│  └─────────────────┘                           │
│                                                 │
│  📊 Progress: ████████░░ 10%                    │
│                                                 │
│  📍 Select Parking Spot:                        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
│  │🏛️ │ │🏢 │ │🏫 │ │🏨 │                  │
│  │Gate│ │Lib │ │Cafe│ │Hostel│                │
│  └────┘ └────┘ └────┘ └────┘                  │
│                                                 │
│  [🛑 END RIDE AT SELECTED SPOT]                │
│                                                 │
│  ⚠️  Park only at designated spots              │
│     ₹100 fine for wrong parking                 │
└─────────────────────────────────────────────────┘
           │
           │ (User riding...)
           │
           ▼
┌─────────────────────┐
│ Request Location    │ 🟨
│ Permission          │
└──────┬──────────────┘
       │
   Granted?
       │
   YES │        NO
       │         └──→ [Warning: Some features limited]
       ▼
┌─────────────────────┐
│ Track Location      │
│ Every 30 seconds    │
└──────────┬──────────┘
           │
           │ (Continuous tracking)
           │
           ▼
┌─────────────────────┐
│ Check Timer         │
└──────┬──────────────┘
       │
   > 20 min?
       │
      YES ──→ [⚠️  OVERTIME WARNING]
       │       [Pulsing Red Timer]
       │       [+₹50 fine accumulating]
       │
      NO
       │
       ▼
```


### 6. END RIDE FLOW
```
┌─────────────────────┐
│ User Selects        │
│ Parking Spot        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Tap "END RIDE"      │ 🟦
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Parking Spot        │ 🟨
│ Selected?           │
└──────┬──────────────┘
       │
      NO ──→ [Alert: Select parking spot first]
       │
      YES
       │
       ▼
┌─────────────────────┐
│ Stop Timer          │
│ Get Final Location  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Calculate Duration  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Check Violations    │ 🟨
└──────┬──────────────┘
       │
       ├─→ Duration > 20 min? ──YES──→ [🟥 Add ₹50 Overtime Fine]
       │                         │
       │                        NO
       │                         │
       ├─→ Distance > 200m? ────YES──→ [🟥 Add ₹100 Wrong Parking Fine]
       │                         │
       │                        NO
       │                         │
       ▼                         ▼
┌─────────────────────┐
│ Update Database     │ 🟩
├─────────────────────┤
│ • End ride          │
│ • Release bicycle   │
│ • Update user stats │
│ • Create fines      │
│ • Add to history    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Show Completion     │ 🟩
├─────────────────────┤
│ ✅ Ride Complete!   │
│                     │
│ Duration: 18 min    │
│ Parked at: Gate     │
│                     │
│ [Fines if any]      │
│                     │
│ Redirecting...      │
└──────────┬──────────┘
           │
      (3 seconds)
           │
           ▼
┌─────────────────────┐
│ Return to           │
│ Home Dashboard      │
└─────────────────────┘
```


---

## 🗺️ MAP VIEW FLOW

### 7. PARKING SPOTS MAP
```
┌─────────────────────────────────────────────────┐
│          MAP VIEW 🟦                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  📍 8 Designated Parking Spots:                 │
│                                                 │
│  1. 🏛️  Institute Main Gate (15/20)            │
│  2. 🏢  Central Library (12/15)                 │
│  3. 🏫  Academic Block A (8/12)                 │
│  4. 🏨  Mega Girls Hostel (10/18)               │
│  5. 🏨  Saraswati Girls Hostel (6/15)           │
│  6. 🏨  Boys Hostel Block C (14/20)             │
│  7. ⚽  Sports Complex (5/10)                    │
│  8. 🍽️  Food Court (9/15)                       │
│                                                 │
│  🔍 Filter:                                     │
│  [ All ] [ Available ] [ Full ]                 │
│                                                 │
│  Status Indicators:                             │
│  🟢 Available (>50% capacity)                   │
│  🟡 Limited (<50% capacity)                     │
│  🔴 Full (0 capacity)                           │
│                                                 │
└─────────────────────────────────────────────────┘
           │
           │ Tap on spot
           ▼
┌─────────────────────┐
│ Show Spot Details   │
├─────────────────────┤
│ • Name              │
│ • Capacity          │
│ • GPS Coordinates   │
│ • Distance from you │
└─────────────────────┘
```

---

## 📜 HISTORY VIEW FLOW

### 8. RIDE HISTORY
```
┌─────────────────────────────────────────────────┐
│          RIDE HISTORY 🟦                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  Filter: [ All ] [ Completed ] [ Fined ]        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🚴 CS-042-K8L3M9                          │ │
│  │ 📅 Dec 10, 2024 • 2:30 PM                │ │
│  │ ⏱️  Duration: 18 min                      │ │
│  │ 📍 Gate → Library                         │ │
│  │ ✅ No fines                               │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🚴 CS-015-P2Q7R4                          │ │
│  │ 📅 Dec 9, 2024 • 10:15 AM                │ │
│  │ ⏱️  Duration: 25 min                      │ │
│  │ 📍 Hostel → Cafe                          │ │
│  │ 🟥 ₹50 Overtime Fine (PENDING)            │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🚴 CS-088-T5U9V2                          │ │
│  │ 📅 Dec 8, 2024 • 4:45 PM                 │ │
│  │ ⏱️  Duration: 15 min                      │ │
│  │ 📍 Library → Sports Complex               │ │
│  │ 🟥 ₹100 Wrong Parking (PAID)              │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Total Rides: 23                                │
│  Total Distance: ~45 km                         │
│                                                 │
└─────────────────────────────────────────────────┘
           │
           │ Tap on ride
           ▼
┌─────────────────────┐
│ Ride Details View   │
├─────────────────────┤
│ • Full route        │
│ • Timestamps        │
│ • Fine breakdown    │
│ • Payment status    │
└─────────────────────┘
```


---

## 👤 PROFILE VIEW FLOW

### 9. USER PROFILE
```
┌─────────────────────────────────────────────────┐
│          USER PROFILE 🟦                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  👤 Tanya Sharma                                │
│  📧 tanya.sharma@college.edu                    │
│  🎓 Student ID: 2021CS001                       │
│  📱 +91 98765 43210                             │
│                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                 │
│  📊 STATISTICS                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ Total Rides: 23                         │   │
│  │ Total Duration: 6h 45m                  │   │
│  │ Daily Usage: 15/60 min                  │   │
│  │ Average Duration: 17 min                │   │
│  │ Favorite Spot: Central Library          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  💰 FINES                                       │
│  ┌─────────────────────────────────────────┐   │
│  │ Pending: ₹150 (3 fines)                 │   │
│  │ Paid: ₹200 (4 fines)                    │   │
│  │ Total: ₹350                             │   │
│  │                                         │   │
│  │ [💳 PAY PENDING FINES]                  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ⚙️  SETTINGS                                   │
│  • Edit Profile                                 │
│  • Change Password                              │
│  • Notification Preferences                     │
│  • Privacy Settings                             │
│                                                 │
│  [🚪 LOGOUT]                                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 👨‍💼 ADMIN FLOWS

### 10. ADMIN DASHBOARD
```
┌─────────────────────────────────────────────────┐
│          ADMIN DASHBOARD 🟪                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 SYSTEM OVERVIEW                             │
│  ┌─────────────────────────────────────────┐   │
│  │ Total Bicycles: 100                     │   │
│  │ • Available: 72                         │   │
│  │ • In Use: 18                            │   │
│  │ • Maintenance: 10                       │   │
│  │                                         │   │
│  │ Active Riders: 18                       │   │
│  │ Today's Rides: 156                      │   │
│  │ Pending Fines: ₹12,450                  │   │
│  │ Banned Users: 3                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  🎯 ADMIN ACTIONS:                              │
│  ┌────────┐ ┌────────┐ ┌────────┐             │
│  │BICYCLES│ │ USERS  │ │ RIDES  │             │
│  └────┬───┘ └────┬───┘ └────┬───┘             │
│       │          │          │                   │
│  ┌────────┐ ┌────────┐ ┌────────┐             │
│  │ FINES  │ │QR CODES│ │PARKING │             │
│  └────┬───┘ └────┬───┘ └────┬───┘             │
└───────┼──────────┼──────────┼───────────────────┘
        │          │          │
        ▼          ▼          ▼
```


### 11. ADMIN - BICYCLE MANAGEMENT
```
┌─────────────────────────────────────────────────┐
│       BICYCLE MANAGEMENT 🟪                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  🔍 Search: [CS-001]  Filter: [All ▼]          │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🚴 CS-001-A7K9M2                          │ │
│  │ Status: 🟢 Available                      │ │
│  │ Location: Institute Main Gate             │ │
│  │ Condition: Good                           │ │
│  │ Last Used: 2 hours ago                    │ │
│  │ Total Rides: 234                          │ │
│  │ [Change Status ▼] [View History]         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🚴 CS-042-K8L3M9                          │ │
│  │ Status: 🔴 In Use                         │ │
│  │ User: Tanya Sharma                        │ │
│  │ Started: 15 min ago                       │ │
│  │ [Force End Ride] [Track Location]        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🚴 CS-088-T5U9V2                          │ │
│  │ Status: 🟡 Maintenance                    │ │
│  │ Issue: Flat tire                          │ │
│  │ Reported: Dec 10, 2024                    │ │
│  │ [Mark as Fixed] [View Report]            │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
           │
           │ Change Status
           ▼
┌─────────────────────┐
│ Select New Status   │
├─────────────────────┤
│ • Available         │
│ • Maintenance       │
│ • Retired           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Update Database     │
│ Send Notification   │
└─────────────────────┘
```

### 12. ADMIN - USER MANAGEMENT
```
┌─────────────────────────────────────────────────┐
│       USER MANAGEMENT 🟪                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  🔍 Search: [Name/Email]  Filter: [All ▼]      │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Tanya Sharma                           │ │
│  │ 📧 tanya.sharma@college.edu               │ │
│  │ 🎓 2021CS001                              │ │
│  │ Status: ✅ Active                         │ │
│  │ Rides: 23 | Fines: ₹150 pending          │ │
│  │ Daily Usage: 15/60 min                    │ │
│  │ [View Details] [Ban User] [Reset Limit]  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Rahul Kumar                            │ │
│  │ 📧 rahul.kumar@college.edu                │ │
│  │ 🎓 2021CS042                              │ │
│  │ Status: 🚫 Banned                         │ │
│  │ Reason: Multiple violations               │ │
│  │ Banned: Dec 5, 2024                       │ │
│  │ [Unban User] [View History]              │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
           │
           │ Ban User
           ▼
┌─────────────────────┐
│ Confirm Ban         │
├─────────────────────┤
│ Reason:             │
│ [Text input]        │
│                     │
│ [Cancel] [Confirm]  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Update User Status  │
│ Send Notification   │
│ End Active Rides    │
└─────────────────────┘
```


### 13. ADMIN - QR CODE MANAGEMENT
```
┌─────────────────────────────────────────────────┐
│       QR CODE MANAGEMENT 🟪                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  📱 Generate & Manage QR Codes                  │
│                                                 │
│  [🖨️  PRINT ALL QR CODES]                       │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🚴 CS-001-A7K9M2                          │ │
│  │                                           │ │
│  │   ┌─────────────────┐                    │ │
│  │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │                    │ │
│  │   │ ▓▓░░░░░░░░░░▓▓ │                    │ │
│  │   │ ▓▓░░▓▓▓▓░░░░▓▓ │                    │ │
│  │   │ ▓▓░░▓▓▓▓░░░░▓▓ │  (QR Code)        │ │
│  │   │ ▓▓░░░░░░░░░░▓▓ │                    │ │
│  │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │                    │ │
│  │   └─────────────────┘                    │ │
│  │                                           │ │
│  │ [📥 Download] [📤 Share] [🔄 Regenerate] │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🚴 CS-002-B3C8D1                          │ │
│  │   [QR Code Display]                       │ │
│  │ [📥 Download] [📤 Share] [🔄 Regenerate] │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ... (100 bicycles total)                       │
│                                                 │
└─────────────────────────────────────────────────┘
           │
           │ Download QR
           ▼
┌─────────────────────┐
│ Generate PNG Image  │
│ Save to Device      │
└─────────────────────┘
```

### 14. ADMIN - FINE MANAGEMENT
```
┌─────────────────────────────────────────────────┐
│       FINE MANAGEMENT 🟪                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  Filter: [ All ] [ Pending ] [ Paid ]           │
│                                                 │
│  Total Pending: ₹12,450 (83 fines)              │
│  Total Paid: ₹45,600 (304 fines)                │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🟥 ₹50 - Overtime Fine                    │ │
│  │ User: Tanya Sharma                        │ │
│  │ Ride: CS-015-P2Q7R4                       │ │
│  │ Date: Dec 9, 2024                         │ │
│  │ Duration: 25 min (5 min over)             │ │
│  │ Status: PENDING                           │ │
│  │ [Mark as Paid] [Waive Fine] [Details]    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 🟥 ₹100 - Wrong Parking                   │ │
│  │ User: Rahul Kumar                         │ │
│  │ Ride: CS-088-T5U9V2                       │ │
│  │ Date: Dec 8, 2024                         │ │
│  │ Location: 350m from designated spot       │ │
│  │ Status: PAID                              │ │
│  │ [View Receipt] [Details]                  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
           │
           │ Mark as Paid
           ▼
┌─────────────────────┐
│ Confirm Payment     │
├─────────────────────┤
│ Amount: ₹50         │
│ Method: [Select]    │
│                     │
│ [Cancel] [Confirm]  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Update Fine Status  │
│ Generate Receipt    │
│ Send Notification   │
└─────────────────────┘
```


---

## 🔄 COMPLETE SYSTEM DATA FLOW

### 15. BACKEND API INTEGRATION
```
┌─────────────────────────────────────────────────┐
│              FRONTEND (React Native)            │
└──────────────────────┬──────────────────────────┘
                       │
                       │ HTTP Requests (REST API)
                       │ Authorization: Bearer <JWT>
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              BACKEND (Express.js)               │
├─────────────────────────────────────────────────┤
│                                                 │
│  🔐 Authentication Middleware                   │
│  ├─→ Verify JWT Token                          │
│  ├─→ Check User Role                           │
│  └─→ Attach User to Request                    │
│                                                 │
│  📡 API Routes:                                 │
│  ├─→ /api/auth (Login, Signup)                 │
│  ├─→ /api/bicycles (CRUD operations)           │
│  ├─→ /api/rides (Start, End, History)          │
│  ├─→ /api/fines (Create, Pay, List)            │
│  ├─→ /api/parking-spots (List, Update)         │
│  └─→ /api/admin (Admin operations)             │
│                                                 │
└──────────────────────┬──────────────────────────┘
                       │
                       │ Mongoose ODM
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│           DATABASE (MongoDB Atlas)              │
├─────────────────────────────────────────────────┤
│                                                 │
│  📦 Collections:                                │
│                                                 │
│  👤 users                                       │
│  ├─→ name, email, studentId, phone             │
│  ├─→ password (hashed), role                   │
│  ├─→ totalRides, dailyUsage, fines             │
│  └─→ isBanned, createdAt                       │
│                                                 │
│  🚴 bicycles                                    │
│  ├─→ bicycleId, qrCode                         │
│  ├─→ status (available/in-use/maintenance)     │
│  ├─→ location, condition                       │
│  └─→ lastUsed, totalRides                      │
│                                                 │
│  🎫 rides                                       │
│  ├─→ userId, bicycleId                         │
│  ├─→ startTime, endTime, duration              │
│  ├─→ startLocation, endLocation                │
│  └─→ fineAmount, status                        │
│                                                 │
│  💰 fines                                       │
│  ├─→ userId, rideId                            │
│  ├─→ amount, reason                            │
│  ├─→ status (pending/paid)                     │
│  └─→ createdAt, paidAt                         │
│                                                 │
│  📍 parkingspots                                │
│  ├─→ name, icon, coordinates                   │
│  ├─→ capacity, currentOccupancy                │
│  └─→ status                                    │
│                                                 │
└─────────────────────────────────────────────────┘
```


---

## 🎨 EXCALIDRAW CREATION TIPS

### Step-by-Step Guide:

1. **Open Excalidraw** (https://excalidraw.com)

2. **Create Main Sections** (Use large rectangles with labels):
   - Authentication Flow (Top Left)
   - User Dashboard (Center)
   - Scan & Ride Flow (Top Right)
   - Active Ride (Middle Right)
   - End Ride (Bottom Right)
   - Map/History/Profile (Bottom Center)
   - Admin Section (Left Side)

3. **Use Shapes**:
   - **Rectangles**: For screens/pages
   - **Rounded Rectangles**: For buttons/actions
   - **Diamonds**: For decision points
   - **Circles**: For status indicators
   - **Arrows**: For flow direction

4. **Color Scheme** (Match CycleSync theme):
   - Background: `#0A0E1A` (Dark blue)
   - Primary: `#00D4FF` (Cyan blue)
   - Success: `#10B981` (Green)
   - Warning: `#F59E0B` (Yellow)
   - Danger: `#EF4444` (Red)
   - Admin: `#7C3AED` (Purple)
   - Text: `#FFFFFF` (White)

5. **Layout Structure**:
   ```
   ┌─────────────────────────────────────────────────┐
   │                                                 │
   │  [AUTH]     [SCAN]      [ACTIVE RIDE]          │
   │    │          │              │                  │
   │    ▼          ▼              ▼                  │
   │  [LOGIN]   [VALIDATE]    [TIMER]               │
   │    │          │              │                  │
   │    ▼          ▼              ▼                  │
   │ [DASHBOARD] [START]      [END RIDE]            │
   │    │          │              │                  │
   │    ├──────────┼──────────────┤                 │
   │    │          │              │                  │
   │    ▼          ▼              ▼                  │
   │  [MAP]    [HISTORY]      [PROFILE]             │
   │                                                 │
   │  ┌─────────────────────────────────┐           │
   │  │      ADMIN SECTION              │           │
   │  │  [BICYCLES] [USERS] [FINES]     │           │
   │  └─────────────────────────────────┘           │
   │                                                 │
   └─────────────────────────────────────────────────┘
   ```

6. **Add Icons** (Use Excalidraw's library):
   - 🚴 Bicycle
   - 👤 User
   - 📱 Phone/Camera
   - 📍 Location
   - ⏱️ Timer
   - 💰 Money/Fines
   - ✅ Success
   - ❌ Error
   - ⚠️ Warning

7. **Connection Types**:
   - **Solid arrows**: Normal flow
   - **Dashed arrows**: Alternative/error paths
   - **Thick arrows**: Main user journey
   - **Colored arrows**: Match the destination color

8. **Text Formatting**:
   - **Bold**: Screen titles
   - Regular: Descriptions
   - Small: Details/notes
   - Monospace: Code/IDs


---

## 📊 KEY BUSINESS RULES TO HIGHLIGHT

### Important Constraints (Add as callout boxes):

```
┌─────────────────────────────────────┐
│  ⚠️  BUSINESS RULES                 │
├─────────────────────────────────────┤
│  • Max ride duration: 20 minutes    │
│  • Daily usage limit: 60 minutes    │
│  • Overtime fine: ₹50               │
│  • Wrong parking fine: ₹100         │
│  • Parking radius: 200 meters       │
│  • Total bicycles: 100              │
│  • Parking spots: 8                 │
│  • College email required           │
└─────────────────────────────────────┘
```

---

## 🔐 SECURITY FLOW

### Authentication & Authorization:
```
┌─────────────────────┐
│ User Login          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Validate Password   │
│ (bcrypt compare)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Generate JWT Token  │
│ (24h expiry)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Store in            │
│ SecureStore         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ All API Requests    │
│ Include Token       │
│ in Header           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Backend Verifies    │
│ Token on Each       │
│ Request             │
└─────────────────────┘
```

---

## 📱 PERMISSION FLOW

### Camera & Location Permissions:
```
┌─────────────────────┐
│ User Opens Scanner  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Check Camera        │
│ Permission          │
└──────┬──────────────┘
       │
   Granted?
       │
      NO ──→ [Request Permission]
       │           │
       │       Granted?
       │           │
       │          NO ──→ [Show Manual Entry]
       │           │
       │          YES
       │           │
      YES          │
       │           │
       └───────────┘
           │
           ▼
┌─────────────────────┐
│ Open Camera View    │
└─────────────────────┘

┌─────────────────────┐
│ User Starts Ride    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Check Location      │
│ Permission          │
└──────┬──────────────┘
       │
   Granted?
       │
      NO ──→ [Request Permission]
       │           │
       │       Granted?
       │           │
       │          NO ──→ [Warning: Limited features]
       │           │
       │          YES
       │           │
      YES          │
       │           │
       └───────────┘
           │
           ▼
┌─────────────────────┐
│ Start Location      │
│ Tracking (30s)      │
└─────────────────────┘
```

---

## 🎯 SIMPLIFIED USER JOURNEY (One-Page View)

```
                    START
                      │
                      ▼
              ┌───────────────┐
              │  Open App     │
              └───────┬───────┘
                      │
              ┌───────▼───────┐
              │ Login/Signup  │
              └───────┬───────┘
                      │
              ┌───────▼───────┐
              │   Dashboard   │
              └───────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   ┌────────┐   ┌────────┐   ┌────────┐
   │  Scan  │   │  Map   │   │History │
   └────┬───┘   └────────┘   └────────┘
        │
        ▼
   ┌────────┐
   │ Start  │
   │  Ride  │
   └────┬───┘
        │
        ▼
   ┌────────┐
   │ Active │
   │  Ride  │
   └────┬───┘
        │
        ▼
   ┌────────┐
   │  End   │
   │  Ride  │
   └────┬───┘
        │
        ▼
   ┌────────┐
   │ Check  │
   │ Fines  │
   └────┬───┘
        │
        ▼
   ┌────────┐
   │  Pay   │
   │ (if any)│
   └────┬───┘
        │
        ▼
      DONE
```

---

## 📝 NOTES FOR EXCALIDRAW

1. **Start with the main user journey** (simplified version above)
2. **Add details progressively** - don't overcrowd
3. **Use grouping** to organize related flows
4. **Add legends** for colors and symbols
5. **Include timestamps** for time-sensitive actions
6. **Show error paths** with dashed lines
7. **Highlight critical decisions** with larger diamonds
8. **Use consistent spacing** between elements
9. **Add mini-screens** showing actual UI where helpful
10. **Include data flow** between frontend/backend/database

---

## 🎨 FINAL TOUCHES

### Add These Elements:

1. **Title Box** (Top center):
   ```
   ┌─────────────────────────────────────┐
   │  🚴 CYCLESYNC - USER FLOW DIAGRAM   │
   │  Smart Campus Bicycle Sharing       │
   └─────────────────────────────────────┘
   ```

2. **Legend** (Bottom right):
   ```
   ┌─────────────────────┐
   │  LEGEND             │
   ├─────────────────────┤
   │  🟦 User Action     │
   │  🟩 Success         │
   │  🟥 Error/Fine      │
   │  🟨 Validation      │
   │  🟪 Admin           │
   │  ◇  Decision        │
   │  →  Flow            │
   │  ⇢  Alternative     │
   └─────────────────────┘
   ```

3. **Statistics Box** (Top right):
   ```
   ┌─────────────────────┐
   │  SYSTEM STATS       │
   ├─────────────────────┤
   │  Bicycles: 100      │
   │  Parking: 8 spots   │
   │  Max Ride: 20 min   │
   │  Daily: 60 min      │
   └─────────────────────┘
   ```

---

## ✅ CHECKLIST

Before finalizing your Excalidraw diagram:

- [ ] All main user flows included
- [ ] Admin flows clearly separated
- [ ] Decision points marked with diamonds
- [ ] Error paths shown with dashed lines
- [ ] Colors match CycleSync theme
- [ ] Icons used consistently
- [ ] Text is readable (not too small)
- [ ] Arrows show clear direction
- [ ] No overlapping elements
- [ ] Legend included
- [ ] Title and description added
- [ ] Business rules highlighted
- [ ] Permission flows shown
- [ ] API integration indicated
- [ ] Database structure referenced

---

## 🚀 READY TO CREATE!

You now have everything you need to create a comprehensive flowchart in Excalidraw.
Start with the simplified journey, then add details section by section.

**Pro Tip**: Create multiple artboards in Excalidraw:
1. Overview (simplified journey)
2. User Flows (detailed)
3. Admin Flows (detailed)
4. Technical Architecture (backend/database)

This makes it easier to present different levels of detail to different audiences!
