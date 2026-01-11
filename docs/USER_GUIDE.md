# 📖 User Guide: Smart Course Registration Extension

## Quick Start

### Step 1: Install the Extension

1. Download or clone this repository
2. Open Chrome/Brave browser
3. Go to `chrome://extensions/` or `brave://extensions/`
4. Enable **Developer mode** (toggle in top-right)
5. Click **Load unpacked**
6. Select the `extension/` folder

### Step 2: Use on UCP Portal

1. Log in to [horizon.ucp.edu.pk](https://horizon.ucp.edu.pk)
2. Navigate to **Course Registration** page
3. Click the extension icon in your toolbar (📅)
4. Follow the 4-step process:

---

## 📋 The 4-Step Process

### 1️⃣ Scan
- Click **"Scan Available Courses"**
- The extension reads all course sections from the portal
- Wait for scan to complete (1-2 seconds)

### 2️⃣ Select Courses
- Choose which courses you want to register
- Click on course names to toggle selection
- Click **"Next: Set Preferences"**

### 3️⃣ Set Preferences

| Option              | Description                               |
| ------------------- | ----------------------------------------- |
| **Preferred Days**  | Click to toggle Mon-Fri (blue = selected) |
| **Start Time**      | Earliest class you want (e.g., 9 AM)      |
| **End Time**        | Latest class end (e.g., 5 PM)             |
| **Max Campus Days** | Target days per week (2-5)                |
| **Max Gap**         | Acceptable gap between classes            |

Click **"Generate Optimal Timetables"**

### 4️⃣ View Results
- See top 10 timetable options ranked by score
- Higher score = better match to your preferences
- Click any option to view the full timetable grid
- Click **"Apply This Schedule"** to add sections to cart

---

## ⚠️ Warnings

### "Some Courses Excluded"
If you see this warning, it means some selected courses don't have sections that fit your time/day preferences.

**Options:**
- Click **"Adjust Filters"** to change your preferences
- Click **"Continue Without Them"** to see timetables without those courses

---

## 💡 Tips

1. **Start with fewer courses** (3-4) for faster results
2. **Use morning time filter** if you prefer morning classes
3. **Lower max days** for a more compact schedule
4. **Compare multiple options** before applying

---

## 🧪 Testing with Prototype

If you want to test without the real portal:

```bash
cd prototype/
python3 -m http.server 8080
# Open http://localhost:8080 in browser
# Then use the extension on this page
```
