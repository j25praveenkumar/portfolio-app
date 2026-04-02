import { useState } from "react";
import { getProjects } from "../store";
import "./Projects.css";

function Carousel({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);
  return (
    <div className="carousel">
      <img src={images[idx]} alt={`slide-${idx}`} className="project-image" />
      {images.length > 1 && (
        <>
          <button className="car-btn car-prev" onClick={e => { e.stopPropagation(); prev(); }}>&#8249;</button>
          <button className="car-btn car-next" onClick={e => { e.stopPropagation(); next(); }}>&#8250;</button>
          <div className="car-dots">
            {images.map((_, i) => (
              <span key={i} className={`car-dot${i === idx ? " active" : ""}`}
                onClick={e => { e.stopPropagation(); setIdx(i); }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=320&fit=crop";

function Projects() {
  const projects = getProjects();

  return (
    <section>
      <h2 className="section-title">Projects</h2>

      <div className="projects-grid">
        {projects.length === 0 && (
          <p>No projects available</p>
        )}

        {projects.map(project => {
          const imgs = project.images?.length
            ? project.images
            : project.image_url
              ? [project.image_url]
              : [DEFAULT_IMAGE];
          return (
            <div
              key={project.id}
              className="project-card"
              onClick={() => window.open(project.github_url, "_blank")}
              style={{ cursor: "pointer" }}
            >
              <Carousel images={imgs} />
              <div className="project-card-body">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                {project.tech_stack && <small>{project.tech_stack}</small>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Projects;
