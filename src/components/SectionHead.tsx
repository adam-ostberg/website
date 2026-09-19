import type { StationKind } from "../three/robots/Stations";

type Props = {
  title: string;
  lede?: string;
  /** Which robot station plays next to the heading. Omit for none. */
  shape?: StationKind;
  /** Colour of the robots, defaults to dark ink. */
  ink?: string;
  accent?: string;
};

export function SectionHead({ title, lede, shape, ink, accent }: Props) {
  return (
    <header className={`section-head ${shape ? "" : "section-head--plain"}`}>
      <div>
        <h2 data-reveal>{title}</h2>
        {lede && (
          <p className="lede" data-reveal>
            {lede}
          </p>
        )}
      </div>
      {shape && <div className="shape-anchor" data-shape={shape} data-ink={ink} data-accent={accent} aria-hidden="true" />}
    </header>
  );
}
