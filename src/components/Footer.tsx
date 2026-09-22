import { site } from "../content/site";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner label">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        {site.github && (
          <a href={site.github} target="_blank" rel="noopener noreferrer">
            github ↗
          </a>
        )}
        <span>{site.location.toLowerCase()}</span>
      </div>
    </footer>
  );
}
