import { useState } from "react";
import { site } from "../content/site";
import { delay } from "./util";

/** Copies the address, for readers whose mailto: links open nothing (webmail, work laptops). */
function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the address is right there to select by hand.
    }
  };
  return (
    <button className="btn btn--sm contact__copy" type="button" onClick={copy} aria-live="polite">
      {copied ? "copied ✓" : "copy"}
    </button>
  );
}

export function Contact() {
  return (
    <section id="contact" className="section contact">
      <div className="container">
        <h2 data-reveal>Let's talk.</h2>
        <p className="lede" data-reveal style={delay(80)}>
          I'm looking for a summer 2027 internship in software or ML engineering, ideally somewhere close to robotics.
          Email is the fastest way to reach me.
        </p>
        <div className="contact__email-row" data-reveal style={delay(160)}>
          <a className="contact__email" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <CopyEmail />
        </div>
        <div className="contact__links" data-reveal style={delay(240)}>
          <a className="btn" href={site.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn ↗
          </a>
          {site.github && (
            <a className="btn" href={site.github} target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
          )}
          <a className="btn" href={site.cv} target="_blank" rel="noopener noreferrer">
            Download CV ↗
          </a>
        </div>
      </div>
    </section>
  );
}
