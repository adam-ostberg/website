import { site } from "../content/site";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner label">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span>github</span>
        <span>{site.location.toLowerCase()}</span>
      </div>
    </footer>
  );
}
