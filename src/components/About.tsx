import { about } from "../content/about";
import { site } from "../content/site";
import { SectionHead } from "./SectionHead";
import { delay } from "./util";

export function About() {
  return (
    <section id="about" className="section section--light">
      <div className="container">
        <SectionHead title="The rest of me." shape="retry" />
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
            <div className="about__notes win" data-reveal style={delay(80)}>
              <div className="win__bar">
                <span>notes.txt</span>
              </div>
              <div className="about__notes-body">
                {about.paragraphs.map((p) => (
                  <p className="about__text" key={p}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
