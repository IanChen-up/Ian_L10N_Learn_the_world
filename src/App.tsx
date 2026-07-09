import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Resources from "@/pages/Resources";
import ExploreCountry from "@/pages/ExploreCountry";
import AILayer from "@/components/ai/AILayer";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/country/:iso" element={<Home />} />
        <Route path="/browse/:dimension/:value" element={<Home />} />
        <Route path="/explore/:iso" element={<ExploreCountry />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/about" element={<About />} />
      </Routes>
      <AILayer />
    </Router>
  );
}
