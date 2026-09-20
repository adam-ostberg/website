import { now } from "../content/now";
import { tools } from "../content/skills";
import { SectionHead } from "./SectionHead";
import { delay } from "./util";

function ToolStrip() {
  const group = (
    <div className="marquee__group" aria-hidden="true">
      {tools.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  );
  return (
    <div className="marquee" data-reveal>
      <span className="sr-only">Tools: {tools.join(", ")}</span>
      <div className="marquee__track">
        {group}
        {group}
      </div>
    </div>
  );
}

export function Now() {
  return (
    <section id="now" className="section section--light">
      <div className="container">
        <SectionHead title="Studying AI, working with data, looking for the next step." shape="arm" />
        <div className="win" data-reveal>
          <div className="win__bar">
            <span>status.txt</span>
            <span>{new Date().getFullYear()}</span>
          </div>
          <div className="now-grid">
            {now.map((cell, i) => (
              <div className="now-cell" key={cell.label} data-reveal style={delay(i * 90)}>
                <span className="label label--inverse">{cell.label}</span>
                <h3>{cell.title}</h3>
                <p>{cell.text}</p>
              </div>
            ))}
          </div>
        </div>
        <ToolStrip />
      </div>
    </section>
  );
}
