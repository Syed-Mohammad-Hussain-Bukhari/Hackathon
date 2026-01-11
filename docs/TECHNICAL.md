# 🔧 Technical Documentation: How It Works

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Popup     │◄──►│  Background │◄──►│  Content    │     │
│  │   (UI)      │    │   (Logic)   │    │  (Scraper)  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│        ▲                                      │             │
│        │                                      ▼             │
│        │                            ┌─────────────────┐     │
│        │                            │   Portal DOM    │     │
│        │                            │   (Courses)     │     │
│        │                            └─────────────────┘     │
└────────┼────────────────────────────────────────────────────┘
         │
         ▼
   User Interaction
```

---

## Components

### 1. Manifest (manifest.json)
- Manifest V3 Chrome extension configuration
- Permissions: `activeTab`, `storage`
- Host permissions for UCP portal and localhost

### 2. Popup UI (popup/)
- **popup.html**: Multi-step wizard interface
- **popup.css**: Minimalist styling with gradients
- **popup.js**: Main logic including:
  - Course selection management
  - Filter preferences
  - Optimization algorithm
  - Results display

### 3. Content Script (content/)
- **content.js**: DOM scraper that:
  - Extracts course sections from portal
  - Reads data attributes from section cards
  - Handles enroll button clicks
- **content.css**: Visual indicator on page

---

## Optimization Algorithm

### Input
- Selected courses with available sections
- User preferences (days, time, gaps)

### Process

#### Step 1: Filter Sections
```javascript
sections.filter(s => 
    selectedCourses.has(s.courseCode) && 
    s.status === 'open' &&
    sectionFitsTimeFilter(s, filters)
)
```

#### Step 2: Generate Combinations
Uses iterative combination generation with limits:
- Max 50,000 combinations
- Auto-reduces sections per course if too many

#### Step 3: Conflict Detection
```javascript
function timesOverlap(time1, time2) {
    // Parse "HH:MM - HH:MM" format
    // Check if intervals overlap
    return start1 < end2 && start2 < end1;
}
```

#### Step 4: Scoring
```javascript
score = (6 - numberOfDays) * 100;  // Fewer days = higher
if (days <= maxDays) score += 200; // Bonus for preference
```

### Output
Top 10 valid schedules sorted by score

---

## Data Flow

```
1. User clicks "Scan"
         ↓
2. popup.js sends message to content.js
         ↓
3. content.js queries DOM: 
   document.querySelectorAll('.section-card')
         ↓
4. Extracts data-* attributes:
   - data-course-code
   - data-course-name
   - data-section-id
   - data-status
   - data-schedule (JSON)
         ↓
5. Returns array to popup.js
         ↓
6. User sets preferences & generates
         ↓
7. Algorithm processes combinations
         ↓
8. Top 10 results displayed
         ↓
9. User applies → popup.js tells content.js to click enroll
```

---

## DOM Scraping Selectors

The extension looks for these elements on the portal:

| Selector             | Purpose                        |
| -------------------- | ------------------------------ |
| `.section-card`      | Each course section card       |
| `[data-course-code]` | Course code (e.g., "CSCS4963") |
| `[data-status]`      | "open" or "close"              |
| `[data-schedule]`    | JSON array of {day, time}      |
| `.enroll-btn`        | Enrollment button to click     |

---

## Limitations

1. **Combination Limit**: Max 50,000 to prevent crashes
2. **Section Limit**: Auto-reduces to 8 per course if too many
3. **No Backend**: Everything runs client-side in browser
4. **Portal Dependency**: Requires specific DOM structure
