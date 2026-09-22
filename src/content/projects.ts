// ---------------------------------------------------------------------------
// HOW TO ADD A PROJECT
// 1. Drop a screenshot into /public/assets (16:10 or wider looks best).
// 2. Add an object to the array below. Only `title`, `kind`, `year`,
//    `description` and `tags` are required. Projects render in array order.
// 3. Set `featured: true` on ONE project to make it the large card at the top.
// Keep descriptions to two short sentences; the card is skimmed, not read.
// `role` and `facts` are what a recruiter looks for: who you were on it, and
// one or two numbers (users, data size, accuracy, team size).
// ---------------------------------------------------------------------------

export type Project = {
  title: string;
  /** Short category shown above the title, e.g. "Applied AI · Web app". */
  kind: string;
  year: string;
  description: string;
  /** Your part in it, one short line, e.g. "Team of 5 · I built the scrapers and the price database". */
  role?: string;
  /** Up to three short, concrete facts. Numbers where possible. */
  facts?: string[];
  tags: string[];
  /** Path under /public, e.g. "/assets/my-project.png". */
  image?: string;
  imageAlt?: string;
  /** Live demo URL. */
  link?: string;
  /** Source code URL. */
  repo?: string;
  /** Write-up or report, e.g. "/assets/dropout-report.pdf". */
  report?: string;
  /** Inverts the image colours (useful for light plots if a card is ever dark). */
  invertForDark?: boolean;
  /** Renders as the large card spanning the full width. */
  featured?: boolean;
};

export const projects: Project[] = [
  {
    title: "Matjakt",
    kind: "Web app · Bachelor's project",
    year: "2026",
    description:
      "Enter a shopping list and it works out what to buy where, balancing price against how far you'd travel. It runs on several million price points scraped from ICA and Coop stores.",
    role: "Team of 4 · I built the web scrapers and the price database, and helped on the web app.",
    tags: ["Web scraping", "SQL", "TypeScript", "React"],
    image: "/assets/matjakt.jpg",
    imageAlt: "The Matjakt start page, showing live price finds from Stockholm grocery stores",
    link: "https://matjakt.org/",
    featured: true,
  },
  {
    title: "This website",
    kind: "3D web · Personal project",
    year: "2026",
    description:
      "Every robot on this page is built from boxes and cylinders in code, with no 3D models. The arms solve their own inverse kinematics, and one of them misses its first grab on purpose.",
    tags: ["three.js", "React Three Fiber", "GLSL", "TypeScript"],
    image: "/assets/site.jpg",
    imageAlt: "The robot production line from the top of this page",
    repo: "https://github.com/adam-ostberg/website",
  },
  {
    title: "CineMatcher",
    kind: "Web app · Team project",
    year: "2024",
    description:
      "Swipe, match, watch. Helps a group agree on a movie through live sessions and a matching algorithm. Built with two friends.",
    tags: ["TypeScript", "React", "Firebase"],
    image: "/assets/cinematcher.jpg",
    imageAlt: "The CineMatcher application",
    link: "https://cinemamatcher.web.app/",
  },
  {
    title: "Dropout Prediction",
    kind: "Machine learning",
    year: "2024",
    description:
      "An XGBoost classifier that predicts student dropout risk, tuned with feature engineering and cross-validation.",
    tags: ["Python", "scikit-learn", "XGBoost"],
    image: "/assets/pca-projection.png",
    imageAlt: "PCA projection of the student dataset",
  },
];
