<div align="center">

# 📅 Smart Course Registration

### Optimize Your UCP Timetable in Seconds, Not Hours

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

**🏆 Karo Takhleeq 2026 Hackathon Entry**

*Solving the chaos of UCP course registration*

</div>

---

## 🎯 Problem Statement

Every semester, **16,000+ UCP students** face the same frustrating challenge:

| Pain Point | Impact |
|------------|--------|
| ⏰ **Time-consuming** | 70% spend **45+ minutes** on registration |
| 🔄 **Schedule conflicts** | Manual checking of overlapping classes |
| 📱 **Portal crashes** | Server overload during registration windows |
| 📅 **Suboptimal schedules** | Ending up with 5-day timetables instead of 3 |

---

## ✨ Our Solution

A **Chrome Extension** that transforms the registration experience:

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Scan Courses → ⚙️ Set Preferences → 📊 View Top 10 →   │
│                  → ✓ Apply Best Schedule                    │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **Smart Scanning** | Automatically extract all course sections from portal |
| 🧠 **AI Optimization** | Generate conflict-free schedules ranked by preferences |
| 📅 **Day Selection** | Choose preferred days (e.g., Mon/Wed/Fri only) |
| ⏰ **Time Filters** | Set class time limits (9 AM - 3 PM) |
| 📊 **Visual Comparison** | Compare top 10 timetable options side-by-side |
| ⚡ **One-Click Apply** | Instantly add optimized sections to cart |

---

## 📊 User Research Results

Based on **30+ survey responses** from UCP students:

```
Registration Time         Schedule Preference       Would Use Extension
     ┌───────────┐            ┌───────────┐            ┌───────────┐
     │ ████████ │ 70%        │ ████████ │ 68%        │ ████████ │ 77%
     │ 45+ min  │            │ 3 Days   │            │ Def. Yes │
     └───────────┘            └───────────┘            └───────────┘
```

**Top Frustrations:**
- 90% - Too time-consuming
- 75% - Hard to avoid conflicts  
- 70% - Sections close while deciding

---

## 🛠️ Tech Stack

```
📦 Extension
├── 📋 Manifest V3          # Chrome Extension manifest
├── 🎨 HTML/CSS             # Minimalist popup UI
├── ⚙️ Vanilla JavaScript   # Core logic & optimization
└── 🔍 DOM Scraping         # Content script for data extraction
```

---

## 📁 Project Structure

```
smart-course-registration/
│
├── 📄 README.md                    # This file
├── 📄 LICENSE                      # MIT License
│
├── 📁 extension/                   # Chrome Extension
│   ├── 📄 manifest.json            # Extension configuration
│   ├── 📁 popup/
│   │   ├── 📄 popup.html           # Main UI
│   │   ├── 📄 popup.css            # Styling
│   │   └── 📄 popup.js             # Logic & optimizer
│   ├── 📁 content/
│   │   ├── 📄 content.js           # DOM scraper
│   │   └── 📄 content.css          # Indicator styles
│   └── 📁 icons/
│       ├── 📄 icon16.png
│       ├── 📄 icon48.png
│       └── 📄 icon128.png
│
├── 📁 prototype/                   # Testing portal mockup
│   ├── 📄 index.html
│   ├── 📄 styles.css
│   ├── 📄 app.js
│   └── 📄 data.js
│
├── 📁 Phase1_Report/               # Phase 1 submission
│   └── 📄 main.tex
│
├── 📁 Phase2_Report/               # Phase 2 submission
│   └── 📄 main.tex
│
└── 📁 docs/                        # Documentation
    ├── 📄 survey_analysis.md
    └── 📄 technical_spec.md
```

---

## 🚀 Quick Start

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/smart-course-registration.git
   ```

2. **Load in Chrome/Brave**
   - Navigate to `chrome://extensions/` or `brave://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the `extension/` folder

3. **Test with prototype**
   ```bash
   cd prototype
   python3 -m http.server 8080
   # Open http://localhost:8080
   ```

### Usage

1. Open the UCP Horizon portal
2. Navigate to course registration page
3. Click the extension icon 📅
4. **Scan** → **Set Preferences** → **Generate** → **Apply**

---

## 👥 Team

<div align="center">

| Name | Role |
|------|------|
| **Muhammad Ahmad** | Lead Developer |
| **Syed Mohammad Hussain Bukhari** | Frontend & UX |
| **Abdul Raffay Naeem** | Research & Testing |

</div>

---

## 📈 Roadmap

- [x] Phase 1: Problem Understanding
- [x] Phase 2: User Validation & MVP Planning
- [ ] Phase 3: Core MVP Implementation
- [ ] Phase 4: UI Polish & Demo

### Future Enhancements
- [ ] Auto-enrollment with one click
- [ ] Waitlist notifications
- [ ] Multi-semester planning
- [ ] Mobile companion app

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ at UCP for Karo Takhleeq 2026**

*Transforming 45 minutes of frustration into 5 minutes of optimization*

</div>
