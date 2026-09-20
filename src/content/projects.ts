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
    kind: "Large scale web scraping · Web app",
    year: "2026",
    description:
      "For my bachelors project me and a group of friends created a website where users can compare prices across major grocery stores across Sweden. They can create a shopping list and through smart algorithms our website will create a list of what to buy from where according the price and distance to user. All data was sourced by us by building automated web scrapers that retrived all price data for all products across all relevant stores with online shops, resulting in multiple million data points.",
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
