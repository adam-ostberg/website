import { robotics } from "../content/robotics";
import { SectionHead } from "./SectionHead";
import { delay } from "./util";

export function Robotics() {
  return (
    <section id="robotics" className="section section--light">
      <div className="container">
        <SectionHead title={robotics.title} shape="spar" />
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
      </div>
    </section>
  );
}
