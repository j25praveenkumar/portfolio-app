import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile, getProjects, getSkills, getIntro } from "../store";
import "./Home.css";

function Home() {
  const profile = getProfile();
  const skills = getSkills();
  const projects = getProjects().slice(0, 2);
  const intro = getIntro();
  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=320&fit=crop";

  /* ================= MOUSE FOLLOW LIGHT ================= */
  useEffect(() => {
    const card = document.querySelector(".hero-content");
    const light = document.querySelector(".mouse-light");

    if (!card || !light) return;

    const moveLight = (e) => {
      const rect = card.getBoundingClientRect();
      light.style.left = e.clientX - rect.left + "px";
      light.style.top = e.clientY - rect.top + "px";
    };

    card.addEventListener("mousemove", moveLight);

    return () => card.removeEventListener("mousemove", moveLight);
  }, []);

  /* ================= SCROLL REVEAL ================= */
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");

    const revealOnScroll = () => {
      reveals.forEach(el => {
        const windowHeight = window.innerHeight;
        const revealTop = el.getBoundingClientRect().top;

        if (revealTop < windowHeight - 80) {
          el.classList.add("active");
        }
      });
    };

    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll();

    return () => window.removeEventListener("scroll", revealOnScroll);
  }, []);

  return (
    <div className="home-wrapper">

      {/* 🔥 HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <div className="mouse-light"></div>

          <>
            <h1 className="hero-title">
              Hi 👋, I'm {profile.name}
            </h1>
            <p className="hero-role">{profile.role}</p>
            <p className="hero-desc">{profile.description}</p>
          </>
        </div>
      </section>

      {/* ⭐ SKILLS SECTION */}
      <section className="skills-section reveal">
        <h2 className="section-title">My Skills</h2>

        <div className="skills-grid">
          {skills.map(skill => (
            <div key={skill.id} className="skill-card">
              <h3>{skill.skill_name}</h3>
              <p>{skill.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 🚀 RECENT PROJECTS */}
      <section className="recent-section reveal">
        <h2 className="section-title">Recent Projects</h2>

        <div className="projects-grid">
          {projects.map(project => {
            const imgs = project.images?.length
              ? project.images
              : project.image_url
                ? [project.image_url]
                : [DEFAULT_IMAGE];
            return (
              <div key={project.id} className="project-card"
                onClick={() => window.open(project.github_url, "_blank")}>
                <div className="carousel">
                  <img src={imgs[0]} alt={project.title} className="project-image" />
                </div>
                <div className="project-card-body">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="center-btn">
          <Link to="/projects" className="see-more">
            See more projects
          </Link>
        </div>
      </section>

      {/* 💎 INTRO CARD — bottom */}
      <section className="intro-card reveal">
        <div className="glass-card">
          <p>{intro.para1}</p>
          <p>{intro.para2}</p>
          <h3 className="thanks-text">{intro.thanks}</h3>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer reveal">
        <h3>Let’s get in touch on my social.</h3>

        <div className="socials">
          <a href="/contact" target="_blank" rel="noreferrer">Contact</a>

        </div>

        <p className="copyright">
          © {new Date().getFullYear()} Praveenkumar.dev
        </p>
      </footer>

    </div>
  );
}

export default Home;
