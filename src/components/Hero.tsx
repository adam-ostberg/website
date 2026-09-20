import { useEffect, useState } from "react";
import { site } from "../content/site";
import { delay } from "./util";

/** Current time in Stockholm, refreshed every 15 seconds. */
function LocalTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: site.timeZone });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <span>
      stockholm{time && ` · ${time}`}
    </span>
  );
}

export function Hero() {
  return (
    <header id="top" className="hero">
      <div className="container hero__inner">
        <h1 data-reveal>
          {site.firstName}
          <br />
          <em>{site.lastName}</em>
        </h1>
        <div className="hero__row">
          <p className="hero__intro" data-reveal style={delay(80)}>
            {site.intro}
          </p>
          <div className="hero__actions" data-reveal style={delay(160)}>
            <a className="btn btn--primary" href={`mailto:${site.email}`}>
              Email me
            </a>
            <a className="btn" href={site.cv} target="_blank" rel="noopener noreferrer">
              Download CV ↗
            </a>
          </div>
        </div>
        <div className="hero__meta label" data-reveal style={delay(240)}>
          <LocalTime />
          {site.metaRow.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
      {/*
        The production line. Sized and positioned by CSS; the 3D scene finds it by
        [data-shape] and plays the station inside it. Light ink and lighter body
        greys, because this one sits on the dark ground rather than a pastel one.
      */}
      <div
        className="hero__stage"
        data-shape="hero"
        data-ink="#e8e8e8"
        data-accent="#f386a1"
        data-solid="#6e6e74"
        data-dark="#3a3a40"
        aria-hidden="true"
      />
      <div className="hero__scroll label" aria-hidden="true">
        scroll ↓
      </div>
    </header>
  );
}
