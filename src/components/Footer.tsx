import { site } from "../content/site";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner label">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span>built with react, three.js and a lot of coffee</span>
        <span>{site.location.toLowerCase()}</span>
      </div>
    </footer>
  );
}
