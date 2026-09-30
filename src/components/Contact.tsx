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
      <div className="container contact__grid">
        <div>
          <h2 data-reveal>Summer 2027?</h2>
          <p className="lede" data-reveal style={delay(80)}>
            I'm looking for an internship in software or ML engineering, ideally somewhere close to robotics. Email is
            the fastest way to reach me.
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
        {/* The one station not used elsewhere: a package is lifted onto a rover and sent off. Light ink, like the hero's. */}
        <div
          className="contact__stage"
          data-shape="arm"
          data-ink="#e8e8e8"
          data-accent="#f386a1"
          data-solid="#6e6e74"
          data-dark="#3a3a40"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
