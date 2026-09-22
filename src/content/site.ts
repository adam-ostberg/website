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
  // Put a new PDF in /public/assets and update the path here.
  cv: "/assets/CV-AdamOstberg.pdf",
  /**
   * The hero paragraph. `link.text` must appear verbatim in `text`; that phrase becomes a
   * link to `link.href`. Keep it to three short sentences.
   */
  intro: {
    text: "CS master's student at KTH, on the AI & Robotics track. I've scraped millions of grocery prices, co-directed a short film, and I'm still a little bitter about coming second in a high-school robot fight. Looking for a summer 2027 internship in software or ML.",
    link: { text: "coming second in a high-school robot fight", href: "#robotics" },
  },
};
