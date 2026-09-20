import { projects, type Project } from "../content/projects";
import { SectionHead } from "./SectionHead";
import { delay } from "./util";

function Card({ p, i }: { p: Project; i: number }) {
  return (
    <article className={`project win${p.featured ? " project--featured" : ""}`} data-reveal style={delay(i * 80)}>
      <div className="win__bar">
        <span>{p.kind.toLowerCase()}</span>
        <span>{p.year}</span>
      </div>
      <div className="project__inner">
        {p.image && (
          <div className={`project__media${p.invertForDark ? " project__media--invert" : ""}`}>
            <img src={p.image} alt={p.imageAlt ?? p.title} loading="lazy" />
          </div>
        )}
        <div className="project__body">
          <h3>{p.title}</h3>
          <p>{p.description}</p>
          <div className="tags">
            {p.tags.map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </div>
          {(p.link || p.repo) && (
            <div className="project__links">
              {p.link && (
                <a href={p.link} target="_blank" rel="noopener noreferrer">
                  [ live ↗ ]
                </a>
              )}
              {p.repo && (
                <a href={p.repo} target="_blank" rel="noopener noreferrer">
                  [ source ↗ ]
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function Projects() {
  return (
    <section id="projects" className="section section--light">
      <div className="container">
        <SectionHead title="Things I've built." lede="From idea to prototype to something people can use." shape="pickup" />
        <div className="projects">
          {projects.map((p, i) => (
            <Card p={p} i={i} key={p.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
