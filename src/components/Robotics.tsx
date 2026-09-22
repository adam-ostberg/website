import { robotics } from "../content/robotics";
import { SectionHead } from "./SectionHead";
import { delay } from "./util";

export function Robotics() {
  return (
    <section id="robotics" className="section section--light">
      <div className="container">
        <SectionHead title={robotics.title} shape="spar" />
        <div className={`essay-wrap${robotics.photo ? " essay-wrap--photo" : ""}`}>
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
    </section>
  );
}
