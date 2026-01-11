// ========================================
// UCP Portal Prototype - Expanded Course Data
// 15 sections per course, 3 classes each (2hr + 2hr + 1hr)
// ========================================

// Helper function to generate time slots
function generateTimeSlot(hour, duration) {
    const startHour = hour;
    const endHour = hour + duration;
    const format = (h) => `${h.toString().padStart(2, '0')}:00`;
    return `${format(startHour)} - ${format(endHour)}`;
}

// Days of the week
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Generate sections for a course
function generateSections(courseCode, prefix) {
    const sections = [];
    const sectionTypes = ['G', 'F']; // Group and Lab sections

    // Time slots for variety
    const timeSlots = [
        { days: ['Mon', 'Wed'], times: [{ start: 8, dur: 2 }, { start: 10, dur: 2 }, { start: 12, dur: 1 }] },
        { days: ['Mon', 'Wed'], times: [{ start: 9, dur: 2 }, { start: 11, dur: 2 }, { start: 13, dur: 1 }] },
        { days: ['Mon', 'Wed'], times: [{ start: 10, dur: 2 }, { start: 12, dur: 2 }, { start: 14, dur: 1 }] },
        { days: ['Mon', 'Wed'], times: [{ start: 11, dur: 2 }, { start: 13, dur: 2 }, { start: 15, dur: 1 }] },
        { days: ['Mon', 'Wed'], times: [{ start: 14, dur: 2 }, { start: 16, dur: 1 }, { start: 17, dur: 2 }] },
        { days: ['Tue', 'Thu'], times: [{ start: 8, dur: 2 }, { start: 10, dur: 2 }, { start: 12, dur: 1 }] },
        { days: ['Tue', 'Thu'], times: [{ start: 9, dur: 2 }, { start: 11, dur: 2 }, { start: 13, dur: 1 }] },
        { days: ['Tue', 'Thu'], times: [{ start: 10, dur: 2 }, { start: 12, dur: 2 }, { start: 14, dur: 1 }] },
        { days: ['Tue', 'Thu'], times: [{ start: 11, dur: 2 }, { start: 13, dur: 2 }, { start: 15, dur: 1 }] },
        { days: ['Tue', 'Thu'], times: [{ start: 14, dur: 2 }, { start: 16, dur: 1 }, { start: 17, dur: 2 }] },
        { days: ['Mon', 'Fri'], times: [{ start: 9, dur: 2 }, { start: 11, dur: 2 }, { start: 13, dur: 1 }] },
        { days: ['Wed', 'Fri'], times: [{ start: 10, dur: 2 }, { start: 12, dur: 2 }, { start: 14, dur: 1 }] },
        { days: ['Tue', 'Fri'], times: [{ start: 8, dur: 2 }, { start: 10, dur: 1 }, { start: 11, dur: 2 }] },
        { days: ['Mon', 'Thu'], times: [{ start: 15, dur: 2 }, { start: 17, dur: 1 }, { start: 9, dur: 2 }] },
        { days: ['Wed', 'Thu'], times: [{ start: 11, dur: 2 }, { start: 13, dur: 1 }, { start: 14, dur: 2 }] }
    ];

    for (let i = 0; i < 15; i++) {
        const slot = timeSlots[i];
        const schedule = [];

        // Add 3 classes: 2hr + 2hr + 1hr
        slot.times.forEach((t, idx) => {
            const day = slot.days[idx % slot.days.length];
            schedule.push({
                day: day,
                time: generateTimeSlot(t.start, t.dur)
            });
        });

        sections.push({
            id: `${courseCode}-F25-BS-CS-S21 ${prefix}${i + 1}`,
            status: Math.random() > 0.25 ? 'open' : 'close', // 75% open
            schedule: schedule
        });
    }

    return sections;
}

const coursesData = [
    {
        code: "CSCS4963",
        name: "Professional Practices",
        type: "compulsory",
        semester: "8th Semester",
        sections: generateSections("CSCS4963", "G")
    },
    {
        code: "CSCS5241",
        name: "Parallel and Distributed Computing",
        type: "compulsory",
        semester: "8th Semester",
        sections: generateSections("CSCS5241", "G")
    },
    {
        code: "CSMS3403",
        name: "Information Security",
        type: "compulsory",
        semester: "8th Semester",
        sections: generateSections("CSMS3403", "G")
    },
    {
        code: "CSCS4679",
        name: "Compiler Construction",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CSCS4679", "G")
    },
    {
        code: "CSAL4043",
        name: "Introduction to Machine Learning",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CSAL4043", "G")
    },
    {
        code: "CSHU2879",
        name: "Speak Well - English Conversation",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CSHU2879", "G")
    },
    {
        code: "CSAL4293",
        name: "Business Law",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CSAL4293", "G")
    },
    {
        code: "CSAL4003",
        name: "Introduction to Deep Learning",
        type: "elective",
        semester: "8th Semester",
        coReq: "Introduction to Machine Learning",
        sections: generateSections("CSAL4003", "G")
    },
    {
        code: "CSSE4956",
        name: "Software Testing",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CSSE4956", "G")
    },
    {
        code: "CSMM4093",
        name: "Fundamentals of Enterprise Resource Planning",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CSMM4093", "G")
    },
    {
        code: "CSAL4263",
        name: "Introduction to Natural Language Processing",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CSAL4263", "G")
    },
    {
        code: "CSAL4063",
        name: "Numerical Computing",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CSAL4063", "G")
    },
    {
        code: "CSAL3241",
        name: "Artificial Intelligence - Lab",
        type: "compulsory",
        semester: "8th Semester",
        coReq: "Artificial Intelligence",
        sections: generateSections("CSAL3241", "F")
    },
    {
        code: "CSMM3093",
        name: "Technology Entrepreneurship",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CSMM3093", "G")
    },
    {
        code: "CSMM3943",
        name: "Organizational Behavior and Culture",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CSMM3943", "G")
    },
    {
        code: "CSRT3693",
        name: "Game Development",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CSRT3693", "G")
    },
    {
        code: "CRCP5063",
        name: "Mobile Application Development",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CRCP5063", "G")
    },
    {
        code: "CSSE7642",
        name: "Web Application Development",
        type: "elective",
        semester: "8th Semester",
        sections: generateSections("CSSE7642", "G")
    }
];

// Enrollment cart
let enrollmentCart = [];

console.log(`📚 Loaded ${coursesData.length} courses with ${coursesData.length * 15} total sections`);
