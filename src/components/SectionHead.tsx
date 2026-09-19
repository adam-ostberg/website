import type { Variant } from "../three/shapes";

type Props = {
  title: string;
  lede?: string;
  /** Which 3D shape floats next to the heading. Omit for none. */
  shape?: Variant;
  /** Colour of the shape, defaults to dark ink. */
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
