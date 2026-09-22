import { robotics } from "../content/robotics";
import { SectionHead } from "./SectionHead";
import { delay } from "./util";

/*
 * The one dark section between the light ones: this is the part meant to be read, so it
 * gets a change of ground. The fight plays beside the note rather than above it, in the
 * space the narrow measure leaves free, with light ink like the hero's production line.
 */
export function Robotics() {
  return (
    <section id="robotics" className="section section--ink">
      <div className="container">
        <SectionHead title={robotics.title} />
        <div className="essay-wrap">
          <div className="essay win" data-reveal>
            <div className="win__bar">
              <span>{robotics.file}</span>
            </div>
            <div className="essay__body">
              {robotics.paragraphs.map((p, i) => (
                <p key={p} data-reveal style={delay(i * 60)}>
                  {p}
                </p>
              ))}
            </div>
          </div>
          <div className="essay__side">
            <div
              className="essay__arena"
              data-shape="spar"
              data-ink="#e8e8e8"
              data-accent="#f386a1"
              data-solid="#6e6e74"
              data-dark="#3a3a40"
              aria-hidden="true"
            />
            {robotics.photo && (
              <figure className="essay__photo win" data-reveal style={delay(120)}>
                <div className="win__bar">
                  <span>{robotics.photoCaption}</span>
                </div>
                <img src={robotics.photo} alt="The fighting robot from my high-school project" loading="lazy" />
              </figure>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
