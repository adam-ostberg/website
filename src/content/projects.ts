// ---------------------------------------------------------------------------
// HOW TO ADD A PROJECT
// 1. Drop a screenshot into /public/assets (16:10 or wider looks best).
// 2. Add an object to the array below. Only `title`, `kind`, `year`,
//    `description` and `tags` are required. Projects render in array order.
// 3. Set `featured: true` on ONE project to make it the large card at the top.
// Keep descriptions to two short sentences; the card is skimmed, not read.
// ---------------------------------------------------------------------------

export type Project = {
  title: string;
  /** Short category shown above the title, e.g. "Applied AI · Web app". */
  kind: string;
  year: string;
  description: string;
  tags: string[];
  /** Path under /public, e.g. "/assets/my-project.png". */
  image?: string;
  imageAlt?: string;
  /** Live demo URL. */
  link?: string;
  /** Source code URL. */
  repo?: string;
  /** Inverts the image colours (useful for light plots if a card is ever dark). */
  invertForDark?: boolean;
  /** Renders as the large card spanning the full width. */
  featured?: boolean;
};

export const projects: Project[] = [
  {
    title: "Matjakt",
    kind: "Web app · Bachelor’s project",
    year: "2026",
    description:
      "Enter a shopping list and it works out what to buy where, balancing price against how far you’d travel. Custom scrapers pulled several million price points from every major Swedish grocery chain to make the comparison possible.",
    tags: ["Web scraping", "SQL", "TypeScript", "React"],
    image: "/assets/matjakt.png",
    imageAlt: "The matjakt website",
    link: "https://matjakt.org/",
    featured: true,
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
