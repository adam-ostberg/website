import { experience, education } from "../content/experience";
import { skills } from "../content/skills";
import { SectionHead } from "./SectionHead";
import { delay } from "./util";

export function Experience() {
  return (
    <section id="experience" className="section section--light">
      <div className="container">
        <SectionHead title="Where I've worked and studied." shape="relay" />

        <div className="log win" data-reveal>
          <div className="win__bar">
            <span>work.txt</span>
          </div>
          <div className="rows">
            {experience.map((e, i) => (
              <div className="row" key={e.role} data-reveal style={delay(i * 60)}>
                <div className="row__period">
                  {e.period}
                  {e.location && <span className="row__loc"> · {e.location}</span>}
                </div>
                <div>
                  <h3>{e.role}</h3>
                  <div className="row__org">{e.org}</div>
                  <p className="row__text">{e.text}</p>
                  {e.link && (
                    <a className="row__link" href={e.link.href} target="_blank" rel="noopener noreferrer">
                      [ {e.link.label} ↗ ]
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="log win" data-reveal>
          <div className="win__bar">
            <span>education.txt</span>
          </div>
          <div className="rows">
            {education.map((e, i) => (
              <div className="row" key={e.degree} data-reveal style={delay(i * 60)}>
                <div className="row__period">{e.period}</div>
                <div>
                  <h3>{e.degree}</h3>
                  <div className="row__org">{e.school}</div>
                  <p className="row__text">{e.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="log win" data-reveal>
          <div className="win__bar">
            <span>skills.txt</span>
          </div>
          <div className="rows rows--tight">
            {skills.map((s) => (
              <div className="row" key={s.label}>
                <div className="row__period">{s.label}</div>
                <p className="row__text">{s.items}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
