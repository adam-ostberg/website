import { about } from "../content/about";
import { site } from "../content/site";
import { SectionHead } from "./SectionHead";
import { delay } from "./util";

export function About() {
  return (
    <section id="about" className="section section--light section--lavender">
      <div className="container">
        <SectionHead title="Beyond the code." shape="stack" />
        <div className="about">
          <figure className="about__portrait win" data-reveal>
            <div className="win__bar">
              <span>adam.jpg</span>
              <span>tokyo</span>
            </div>
            <img src="/assets/adam.jpg" alt={site.name} loading="lazy" />
          </figure>
          <div className="about__body">
            <p className="about__lead" data-reveal>
              {about.lead}
            </p>
            <div className="about__cols">
              {about.columns.map((c, i) => (
                <div className="win" key={c.title} data-reveal style={delay(i * 80)}>
                  <div className="win__bar">
                    <span>{c.title.toLowerCase()}</span>
                  </div>
                  <ul>
                    {c.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
