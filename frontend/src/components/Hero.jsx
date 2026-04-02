import { useEffect, useState } from "react";
import "./Hero.css";

function Hero() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/profile")
      .then(res => res.json())
      .then(data => setProfile(data));
  }, []);

  if (!profile) return null;

  return (
    <section className="hero">
      <p className="hero-hi">Hi 👋 I’m</p>
      <h1>{profile.name}</h1>
      <h2>{profile.role}</h2>
      <p className="hero-desc">{profile.description}</p>
    </section>
  );
}

export default Hero;
