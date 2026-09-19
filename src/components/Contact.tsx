import { site } from "../content/site";
import { delay } from "./util";

export function Contact() {
  return (
    <section id="contact" className="section contact">
      <div className="container">
        <h2 data-reveal>Let's talk.</h2>
        <p className="lede" data-reveal style={delay(80)}>
          Looking for a team to join next summer. If you have an interesting challenge, say hi.
        </p>
        <a className="contact__email" href={`mailto:${site.email}`} data-reveal style={delay(160)}>
          {site.email}
        </a>
        <div className="contact__links" data-reveal style={delay(240)}>
          <a className="btn" href={site.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn ↗
          </a>
          <a className="btn" href={site.cv} target="_blank" rel="noopener noreferrer">
            Download CV ↗
          </a>
        </div>
      </div>
    </section>
  );
}
