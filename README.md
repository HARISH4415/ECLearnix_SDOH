# CareEquity Frontend (Standalone UI)

A standalone Vue 3 frontend for the CareEquity Health Equity platform. All backend, Python, ML, and Docker dependencies have been omitted so the UI runs completely standalone with full client-side fallbacks and mock data.

## Features Included (UI Frontend Only)

- **Patient Assessment & Data Setup (`/`)**:
  - Full clinical entry form (vitals, chronic conditions, multi-location SDoH entries).
  - Standalone document / OCR extractor (auto-populates clinical labs from uploaded DOCX/PDF records).
  - Assessment history with favorites and recall.
- **Health Equity Dashboard (`/overview`)**:
  - Population risk score breakdown and SDoH vulnerability factors.
  - Interactive multi-agent clinical summary.
- **Social Determinants Map (`/equity-map`)**:
  - Interactive geographical mapping with county-level health equity overlay.
- **SDoH Knowledge Graph & Insights (`/sdoh-insights`)**:
  - Interactive Vis-Network graph visualization with county switchers and SDoH barrier indicators.
- **Predictive Analytics (`/predictive-analytics`)**:
  - Readmission probability, disease progression curves, and clinical risk tiers.
- **Community Resources & Live Navigation (`/community-resources`)**:
  - MapLibre interactive map with nearest food banks, clinics, and transit hubs.
- **Clinical Interventions (`/interventions`)**:
  - Domain-specific care action plans and community partner outreach.
- **Clinical Reports (`/reports`)**:
  - Comprehensive clinical summary reports with print & PDF export capabilities.
- **Subscription Plans (`/plan`)**:
  - Interactive pricing & tier selection.
- **Admin Dashboard (`/admin`, `/admin/users`, `/admin/plans`)**:
  - System metrics, live user management, plan feature editor, and audit logs.
- **Floating AI Assistant**:
  - Contextual clinical equity and SDoH consult chatbot with built-in knowledge responses.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```
Build output is saved to the `dist/` directory.

### Admin Credentials (Optional)
- **Email**: `contact.careequity@gmail.com`
- **Password**: `arjund`
*(Note: Any email and password can also be used to sign in in Standalone UI Mode).*

