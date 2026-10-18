// Sun/moon toggle between light and dark. With no saved choice, the system preference applies.
// Which icon shows is handled in CSS; this only flips the theme and keeps the label accurate.
const root = document.documentElement;
const button = document.querySelector(".theme-toggle");
const systemDark = matchMedia("(prefers-color-scheme: dark)");

const current = () => root.dataset.theme || (systemDark.matches ? "dark" : "light");
const label = () => button.setAttribute("aria-label", `Switch to ${current() === "dark" ? "light" : "dark"} mode`);

button.addEventListener("click", () => {
  const next = current() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
  label();
});
systemDark.addEventListener("change", label);
label();
