USE THS BEFORE STARTING THE APPLICATION
THIS IS THE BACKEND PROCESS 
IMPORTANT TO BE USED IN BROWSER
https://deepfake-worker-web.onrender.com


# --- START COPY HERE ---

# 1. Create the professional README.md file
@'
# 🛡️ TrustGuard AI - Intelligent Deepfake Detection UI

TrustGuard AI is a production-ready interface designed for high-fidelity visual and temporal analysis of synthetic media.

## 🚀 Instructions for Judges (Local Deployment)

To review this project locally, follow these steps to launch the interface. This UI communicates directly with our hosted AI Worker and Supabase Database.

### 1. Clone the Repository
```bash
git clone [https://github.com/Lucifer1708S/UI_DEEPFAKE_DETECTION.git](https://github.com/Lucifer1708S/UI_DEEPFAKE_DETECTION.git)
cd UI_DEEPFAKE_DETECTION


2. Launch the UI
Choose the command that matches your environment to start a local development server:

Option A: Using Node.js (Highly Recommended)
npm install
npm run dev


The UI will typically be available at: http://localhost:5173 (check terminal output)

✨ Features
🔍 Core Detection capabilities
Multi-Modal Analysis: Real-time evaluation of visual artifacts and temporal anomalies.

Explainable AI: Trust scores (0-100%) with detailed breakdown of manipulation markers.

Live Updates: Real-time data streaming via Supabase subscriptions.

🛡️ Trust Verification Levels
85-100%: Highly Trusted (Authentic)

70-84%: Trusted (Minor Compression Artifacts)

50-69%: Uncertain (Manual Review Required)

0-49%: Suspicious (Manipulation Detected)

🛠️ Technology Stack
Frontend: React 18 / Vite (Fast Refresh)

Styling: Tailwind CSS

Database: Supabase (PostgreSQL + Realtime)

AI Backend: EfficientNet-B0 on PyTorch (Hosted on Render)

├── src/
│   ├── components/     # UI Components (Upload, Results, Chart)
│   ├── lib/            # Supabase Client configuration
│   └── App.jsx         # Main Logic & State Management
├── public/             # Static Assets
└── package.json        # Dependencies & Scripts



