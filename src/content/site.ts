// Global facts about you. Everything on the page reads from here.
export const site = {
  name: "Adam Östberg",
  firstName: "Adam",
  lastName: "Östberg",
  location: "Stockholm, Sweden",
  timeZone: "Europe/Stockholm",
  email: "adam@adamostberg.com",
  linkedin: "https://www.linkedin.com/in/adam-%C3%B6stberg-63a009263/",
  github: "https://github.com/adam-ostberg",
  /** This site's source, linked from the footer. */
  repo: "https://github.com/adam-ostberg/website",
  // Put a new PDF in /public/assets and update the path here.
  cv: "/assets/CV-AdamOstberg.pdf",
  /**
   * The hero copy, in three beats: who you are (`lead`, bright), the story (`text`, grey) and what you want (`ask`, bright).
   * `link.text` must appear verbatim in `text`; that phrase becomes a link to `link.href`.
   */
  intro: {
    lead: "CS master's student at KTH, on the AI & Robotics track.",
    text: "I've scraped millions of grocery prices, co-directed a short film, and I'm still a little bitter about coming second in a high-school robot fight.",
    ask: "Looking for a summer 2027 internship in software or ML.",
    link: { text: "coming second in a high-school robot fight", href: "#robotics" },
  },
};
