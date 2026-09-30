import { site } from "../content/site";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner label">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span className="footer__built">
          built by hand in react, three.js and glsl
          {site.repo && (
            <>
              {" · "}
              <a href={site.repo} target="_blank" rel="noopener noreferrer">
                source ↗
              </a>
            </>
          )}
        </span>
        <span>{site.location.toLowerCase()}</span>
      </div>
    </footer>
  );
}
