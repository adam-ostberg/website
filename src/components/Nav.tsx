import { useState, type MouseEvent } from "react";
import { site } from "../content/site";
import { scrollTo } from "../lib/scroll";

const links: [string, string][] = [
  ["projects", "#projects"],
  ["experience", "#experience"],
  ["robotics", "#robotics"],
  ["about", "#about"],
  ["contact", "#contact"],
];

/** Sits at the top of the page and scrolls away with it. */
export function Nav() {
  const [open, setOpen] = useState(false);

  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    scrollTo(href);
    history.replaceState(null, "", href === "#top" ? " " : href);
  };

  return (
    <nav className={`nav${open ? " is-open" : ""}`} aria-label="Main">
      <div className="container nav__inner">
        <a href="#top" className="nav__brand" onClick={(e) => go(e, "#top")}>
          {site.name.toLowerCase()}
        </a>
        <ul className="nav__links">
          {links.map(([label, href]) => (
            <li key={href}>
              <a href={href} onClick={(e) => go(e, href)}>
                {label}
              </a>
            </li>
          ))}
          <li>
            <a className="btn btn--sm" href={site.cv} target="_blank" rel="noopener noreferrer">
              cv ↗
            </a>
          </li>
        </ul>
        <button
          className="nav__toggle"
          type="button"
          aria-expanded={open}
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
