import express from 'express';

const router = express.Router();

// Mock news data
const mockNews = [
  {
    id: 1,
    title: "1970s Bodybuilding Hack Making a Comeback",
    description: "Time under tension (TUT) is being revived by modern trainers for muscle growth.",
    category: "Subjects",
    source: "Men’s Journal",
    date: "2025-05-14",
  },
  {
    id: 2,
    title: "Powerbuilding: The Best of Both Worlds",
    description: "Powerbuilding combines bodybuilding and powerlifting for strength and aesthetics.",
    category: "Features",
    source: "British GQ",
    date: "2025-01-24",
  },
  {
    id: 3,
    title: "Ohio Fitness Festival Tragedy",
    description: "Bodybuilder Jodi Vance, 20, passed away due to dehydration at a competition.",
    category: "News",
    source: "The Independent",
    date: "2025-03-04",
  },
  {
    id: 4,
    title: "Smart Gym Equipment Market Booms",
    description: "Connected gym equipment grows with demand for fitness tech.",
    category: "Features",
    source: "PR Newswire",
    date: "2025-02-06",
  },
  {
    id: 5,
    title: "High-Intensity Interval Training (HIIT) Trends in 2025",
    description: "HIIT workouts evolve with new formats for maximum fat burn.",
    category: "Subjects",
    source: "Fitness Magazine",
    date: "2025-04-10",
  },
  {
    id: 6,
    title: "Mr. Olympia 2025 Preview",
    description: "Top contenders gear up for the ultimate bodybuilding showdown in Las Vegas.",
    category: "News",
    source: "Bodybuilding.com",
    date: "2025-06-01",
  },
];

// GET /api/news
router.get('/', async (req, res) => {
  try {
    res.json(mockNews);
  } catch (err) {
    console.error(`News fetch error: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});



export default router;