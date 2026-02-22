# 1. Create the README.md file with the TrustGuard AI content
@'
# 🛡️ TrustGuard AI - Intelligent Deepfake Detection UI

TrustGuard AI is a production-ready interface designed for high-fidelity visual and temporal analysis of synthetic media. This repository contains the frontend dashboard that facilitates media uploads, real-time trust score tracking, and forensic-grade evidence visualization.

## 🚀 Overview
This UI serves as the primary gateway for users to interact with our multi-modal detection system. It connects seamlessly with a **Supabase** backend and a **PyTorch-based EfficientNet** worker to provide instantaneous feedback on the authenticity of uploaded content.

---

## ✨ Features
* **Intelligent File Handling**: Support for high-resolution images and MP4 video analysis.
* **Live Trust Score (0-100%)**: Dynamic progress bars reflecting real-time evaluation.
* **Forensic Metadata**: Displays underlying file data and manipulation markers.
* **Mobile-Responsive Design**: A sleek, dark-themed interface built for desktop and mobile forensics.

## 🛠️ Tech Stack
* **Frontend**: HTML5, CSS3 (Modern Flex/Grid), JavaScript (ES6+)
* **Database & Real-time**: [Supabase](https://supabase.com/)
* **Backend Architecture**: Python Worker (EfficientNet-B0)

## 📂 Project Structure
```text
├── index.html          # Core dashboard structure
├── style.css           # Custom UI/UX styling and animations
├── script.js           # Supabase connection & UI logic
├── assets/             # Logos, icons, and UI components
└── README.md           # Documentation