# Smart Traffic Violation Monitoring System (STVMS)

A modern, cloud-backed dual-portal web application designed to digitize traffic enforcement workflows and enhance public road safety awareness. Built as a **DBMS Mini Project** for the 4th Semester (CO Alignment) at the **B.M.S. Institute of Technology & Management, Bengaluru**, aligned with **SDG Goal 9: Industry, Innovation, and Infrastructure (Target 9.5)**.

---

## 👥 Team Members & Roles

*   **Pragyan Hota** (USN: 01) 
*   **Lolaa M H** (USN: 02) 
*   **Piyush Maurya** (USN: 03) 
*   **Abhishek Chougala** (USN: 04) 

---

## 📖 Project Overview & Problem Statement

Modern traffic violation management in urban centers operates through three fundamental gaps:
1.  **Siloed & Manual Records:** Traffic violations are recorded manually or in disjointed databases, preventing real-time analytics or query capabilities.
2.  **Lack of Citizen Prevention:** Existing traffic systems only penalize offenders after the fact. Commuters have no real-time access to risk maps or safety route scoring.
3.  **Inefficient Fines Management:** Lack of automated repeat-offender fine escalation, leading to lost revenue and minimal enforcement impact.

**STVMS** addresses these problems through a unified database (Firebase Firestore) hosting two distinct portals:
*   **Officer/Admin Portal:** Providing CRUD operations on violation records, automated fine calculations, repeat-offender status flagging, and interactive hotspot map visualizations.
*   **Citizen Public Portal:** Enabling commuters to look up violations by vehicle registration number and query routes using a safety score that highlights roads with lower violation densities.

---

## 🛠️ Technology Stack

*   **Frontend UI:** React (Vite-powered, responsive layout)
*   **Styling:** Tailwind CSS & Custom CSS Themes (Glassmorphism & HSL Dark Mode)
*   **Database:** Firebase Firestore (Real-time NoSQL document-based database)
*   **Authentication:** Firebase Auth (Secure token-based JWT sessions)
*   **Maps & Navigation:** Google Maps JavaScript API with an automatic, robust **Leaflet.js + OpenStreetMap fallback** for offline or API limit-exceeded situations.
*   **Analytics Charts:** Recharts (Dynamic SVG-based data visualizations)

---

## 🗄️ Database Design & Relational Modeling (3NF)

To fulfill academic criteria, the database was designed as a relational system compliant with **Third Normal Form (3NF)** before being mapped onto Firestore NoSQL document collections.

### Relational Schema (3NF Table List)
1.  **`vehicles`** (`vehicle_id` [PK], `reg_number` [UQ], `owner_name`, `owner_phone`, `owner_email`, `vehicle_type`, `created_at`)
2.  **`officers`** (`officer_id` [PK], `badge_number` [UQ], `name`, `zone`, `username`, `password_hash`, `created_at`)
3.  **`locations`** (`location_id` [PK], `name`, `latitude`, `longitude`, `zone`)
4.  **`violation_types`** (`type_id` [PK], `name`, `base_fine`)
5.  **`violations`** (`violation_id` [PK], `vehicle_id` [FK], `officer_id` [FK], `location_id` [FK], `type_id` [FK], `violation_time`, `evidence_url`, `status`, `created_at`)
6.  **`fines`** (`fine_id` [PK], `violation_id` [FK, UQ], `amount`, `due_date`, `paid_at`, `payment_method`, `is_paid`)
7.  **`route_searches`** (`search_id` [PK], `user_id`, `start_point`, `end_point`, `searched_at`)

### Normalization Highlights
*   **1NF (First Normal Form):** Every column stores atomic values. Multivalued route waypoints are isolated from search queries.
*   **2NF (Second Normal Form):** Partial dependencies are eliminated. Owner info is separated into the `vehicles` table, and officer profile data is separated into `officers`.
*   **3NF (Third Normal Form):** Transitive dependencies are removed. The base fine amounts depend on the violation type, so they are extracted into `violation_types` instead of sitting directly inside the `violations` table.

---

## 💻 Sample SQL Queries vs. Firestore Implementations

### 1. Search Violations by Vehicle Registration
*   **SQL (Relational):**
    ```sql
    SELECT v.*, veh.reg_number 
    FROM violations v
    JOIN vehicles veh ON v.vehicle_id = veh.vehicle_id
    WHERE veh.reg_number = 'KA-03-HA-1111'
    ORDER BY v.violation_time DESC;
    ```
*   **Firestore JS SDK:**
    ```javascript
    const vehQuery = query(collection(db, 'vehicles'), where('regNumber', '==', 'KA-03-HA-1111'));
    const vehSnap = await getDocs(vehQuery);
    if (!vehSnap.empty) {
      const vehicleId = vehSnap.docs[0].id;
      const vioQuery = query(collection(db, 'violations'), where('vehicleId', '==', vehicleId));
      const violations = (await getDocs(vioQuery)).docs.map(d => ({ id: d.id, ...d.data() }));
    }
    ```

### 2. Repeat Offender Detection (High-Frequency Violations)
Identify vehicles with more than 3 violations in the last 90 days.
*   **SQL (Relational):**
    ```sql
    SELECT vehicle_id, COUNT(*) AS violation_count
    FROM violations
    WHERE violation_time >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    GROUP BY vehicle_id
    HAVING COUNT(*) > 3;
    ```
*   **Firestore JS SDK:**
    ```javascript
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const snap = await getDocs(query(collection(db, 'violations'), where('violationTime', '>=', cutoff.toISOString())));
    const counts = {};
    snap.forEach(d => {
      const vId = d.data().vehicleId;
      counts[vId] = (counts[vId] || 0) + 1;
    });
    const repeatOffenders = Object.keys(counts).filter(vId => counts[vId] > 3);
    ```

---

## 🚀 Installation & Local Setup Guide

Follow these steps to run the React development server locally.

### 1. Clone & Open
Download or clone this repository and navigate to the React sub-folder:
```bash
cd smart-traffic/stvms
```

### 2. Configure Environment Keys (`.env`)
Create a new file named `.env` in `smart-traffic/stvms/` and insert your Firebase Web Configuration and Google Maps credentials:
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase Credentials
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Install Dependencies
Run the package installation:
```bash
npm install
```

### 4. Seed Firestore Data
We've integrated a Firestore Seeder utility inside the Officer Login screen. Once the app is running:
1. Open the login portal.
2. Click the floating **"Seed Firestore Mock Data"** button on the page.
3. This will automatically populate your Firestore collections with realistic vehicles, officers, violation types, Bengaluru coordinates (locations), and initial mock violations/fines.

### 5. Launch local server
Start the local development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.
