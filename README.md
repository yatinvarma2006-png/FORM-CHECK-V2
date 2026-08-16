# FormCheck — AI Sports Biomechanics & Movement Analysis Platform (v3.0)

**FormCheck** is an AI-powered sports biomechanics and movement form evaluation platform engineered for **Deadlift** and **Cricket Fast Bowling**.

It features **MediaPipe BlazePose 33-point sub-pixel body tracking**, **100% pixel-locked SVG skeleton overlays**, **rule-based anatomical physics**, **universal human somatotype v2.0 adaptive thresholding**, **one-click PDF report export**, and **multimodal Google Gemini 3.5/3.6 Flash AI vision & chat**.

---

## 📖 Master Documentation
For full architectural details, computer vision formulas, joint angle math, and API endpoints, see:
👉 **[DOCUMENTATION.md](file:///Users/yatinnn/Desktop/batcave/formcheck/DOCUMENTATION.md)**

---

## 🔑 How to Get a Free Gemini API Key & Set Up `.env`

To enable the AI Biomechanics Coach chatbot and Multimodal Vision Inspection:

### **Step 1: Get Your Free Gemini API Key**
1. Go to **Google AI Studio**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account.
3. Click **"Create API key"** (100% FREE, no credit card required).
4. Copy the generated API key string.

### **Step 2: Create & Configure `.env` File**
1. Navigate to the `backend/` directory in the project.
2. Create a file named `.env` (or copy `.env.example`):
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Paste your Gemini API key inside `backend/.env`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

> 🔒 **Security Note**: The `.env` file is included in `.gitignore` and is never committed to GitHub.

---

## ⚡ Quick Start & Installation

### 1. Backend Setup (FastAPI & MediaPipe)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup (React + Vite + Nike Design System)
```bash
cd frontend
npm install
npm run dev
```

### 3. Open Application
- Web UI: **[http://localhost:5173](http://localhost:5173)**
- Backend API Documentation: **[http://localhost:8000/docs](http://localhost:8000/docs)**
