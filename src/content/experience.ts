export type Experience = {
  role: string;
  org: string;
  period: string;
  location?: string;
  /** One sentence. */
  text: string;
};

export const experience: Experience[] = [
  {
    role: "Data annotation intern",
    org: "Stealth AI startup",
    period: "2026 - present",
    location: "Stockholm",
    text: "Creating and quality-checking the training data behind AI/ML models.",
  },
  {
    role: "Co-director, student short film",
    org: "KTH",
    period: "2025 - 2026",
    text: "Led a year-long short film with a large multidisciplinary student team.",
  },
  {
    role: "B2B prospecting",
    org: "Prebona AB",
    period: "Summer 2023",
    location: "Lisbon",
    text: "Prospecting and lead generation alongside a senior salesperson.",
  },
];

export type Education = {
  degree: string;
  school: string;
  period?: string;
  text: string;
};

export const education: Education[] = [
  {
    degree: "M.Sc. Computer Science",
    school: "KTH Royal Institute of Technology",
    period: "2026 - 2028",
    text: "AI & Robotics focus: machine learning and intelligent systems.",
  },
  {
    degree: "B.Sc. Media Technology",
    school: "KTH Royal Institute of Technology",
    period: "2023 - 2026",
    text: "HCI, machine learning, web development and product innovation.",
  },
  {
    degree: "High school year abroad",
    school: "Oxford, United Kingdom",
    text: "Where programming clicked. Won the school's Computer Award.",
  },
];
