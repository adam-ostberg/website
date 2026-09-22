export type Experience = {
  role: string;
  org: string;
  period: string;
  location?: string;
  /** One sentence. */
  text: string;
  /** Optional link shown under the text, e.g. the finished film. */
  link?: { label: string; href: string };
};

export const experience: Experience[] = [
  {
    role: "Data annotation intern",
    org: "Stealth AI startup",
    period: "2026 - present",
    location: "Stockholm",
    text: "Creating and quality-checking training data for ML models. Most of the details are under NDA.",
  },
  {
    role: "Co-director, student short film",
    org: "KTH",
    period: "2025 - 2026",
    text: "Co-led a year-long short film with a crew of 10+ students.",
    // link: { label: "watch", href: "https://…" },
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
  period: string;
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
];
