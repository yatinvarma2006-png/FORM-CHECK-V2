# FormCheck — AI Sports Biomechanics & Form Analysis Platform (v2.5)

**FormCheck** is an AI-powered sports biomechanics and movement form evaluation platform for **Deadlift** and **Cricket Fast Bowling**.

It utilizes **MediaPipe BlazePose 33-point sub-pixel body tracking**, **trigonometric joint kinematic physics**, **anthropometric somatotype adaptive profiling**, and **multimodal Google Gemini 3.6 Flash AI vision & chat**.

---

## 📖 Complete Documentation
For full architectural details, computer vision formulas, joint angle math, and API reference, see:
👉 **[DOCUMENTATION.md](file:///Users/yatinnn/Desktop/batcave/formcheck/DOCUMENTATION.md)**

---

## ⚡ Quick Start

### 1. Start Backend Server
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
```

### 3. Open Application
- Web UI: **[http://localhost:5173](http://localhost:5173)**
- API Docs: **[http://localhost:8000/docs](http://localhost:8000/docs)**
