import { lazy, Suspense, useMemo } from "react";
import { detectQuality } from "./lib/quality";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Projects } from "./components/Projects";
import { Robotics } from "./components/Robotics";
import { Experience } from "./components/Experience";
import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { useReveal } from "./lib/useReveal";
import { useDragWindows } from "./lib/useDragWindows";

/*
 * three.js and the scene are most of the bundle, so they load after the page has painted: the
 * text is readable straight away, and the robots come up behind it a moment later.
 */
const BackgroundScene = lazy(() => import("./three/Scene").then((m) => ({ default: m.BackgroundScene })));
const ShapesScene = lazy(() => import("./three/Scene").then((m) => ({ default: m.ShapesScene })));

export default function App() {
  const quality = useMemo(detectQuality, []);
  useReveal();
  useDragWindows();

  return (
    <>
      <Suspense fallback={null}>
        <BackgroundScene quality={quality} />
      </Suspense>
      <div className="page">
        <a className="skip" href="#projects">
          Skip to projects
        </a>
        <Nav />
        <main>
          <Hero />
          <Projects />
          <Experience />
          <Robotics />
          <About />
          <Contact />
        </main>
        <Footer />
      </div>
      <Suspense fallback={null}>
        <ShapesScene quality={quality} />
      </Suspense>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
