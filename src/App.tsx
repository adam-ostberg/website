import { BackgroundScene, ShapesScene, useQuality } from "./three/Scene";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Now } from "./components/Now";
import { Projects } from "./components/Projects";
import { Experience } from "./components/Experience";
import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { useReveal } from "./lib/useReveal";

export default function App() {
  const quality = useQuality();
  useReveal();

  return (
    <>
      <BackgroundScene quality={quality} />
      <div className="page">
        <Nav />
        <main>
          <Hero />
          <Now />
          <Projects />
          <Experience />
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
