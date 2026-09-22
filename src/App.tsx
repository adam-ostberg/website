import { BackgroundScene, ShapesScene, useQuality } from "./three/Scene";
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

export default function App() {
  const quality = useQuality();
  useReveal();
  useDragWindows();

  return (
    <>
      <BackgroundScene quality={quality} />
      <div className="page">
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
      <ShapesScene quality={quality} />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
