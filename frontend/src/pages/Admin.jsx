import { useState } from "react";
import { getProfile, saveProfile, getSkills, saveSkills, getProjects, saveProjects, getIntro, saveIntro } from "../store";
import { ADMIN_PASSWORD_HASH } from "../data";
import "./Admin.css";

/* ─── SHA-256 via Web Crypto API ─── */
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const SESSION_KEY = "admin_auth";

/* ─── LOGIN GATE ─── */
function LoginGate({ children }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const hash = await sha256(pwd);
    if (hash === ADMIN_PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
    } else {
      setError("Wrong password. Try again.");
    }
    setPwd("");
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };

  if (!authed) {
    return (
      <div className="login-gate">
        <div className="login-box">
          <div className="login-icon">🔐</div>
          <h2>Admin Access</h2>
          <p>Enter your password to continue</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Password"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              autoFocus
              required
            />
            {error && <p className="login-error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Checking..." : "Enter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
      {children}
    </>
  );
}

const staticMessages = [
  { id: 2, name: "Praveenkumar G", email: "j25praveenkumar001@gmail.com", message: "hello", created_at: "2026-02-02T11:47:46.390Z" },
  { id: 1, name: "Praveenkumar G", email: "praveen@serenetechnology.in", message: "hi", created_at: "2026-01-28T16:31:42.360Z" }
];

/* ─── CAROUSEL ─── */
function Carousel({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);
  return (
    <div className="carousel">
      <img src={images[idx]} alt={`slide-${idx}`} className="carousel-img" />
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

/* ─── PROFILE SECTION ─── */
function ProfileSection() {
  const [form, setForm] = useState(getProfile());
  const [intro, setIntro] = useState(getIntro());
  const [status, setStatus] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleIntroChange = (e) => setIntro({ ...intro, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveProfile(form);
    saveIntro(intro);
    setStatus("Updated successfully ✅");
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <div className="profile-admin-wrapper">
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <label>Name</label>
        <input name="name" value={form.name} onChange={handleChange} required />
        <label>Role</label>
        <input name="role" value={form.role} onChange={handleChange} required />
        <label>Hero Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} required />

        <label>Intro Paragraph 1</label>
        <textarea name="para1" value={intro.para1} onChange={handleIntroChange} required />
        <label>Intro Paragraph 2</label>
        <textarea name="para2" value={intro.para2} onChange={handleIntroChange} required />
        <label>Thanks Text</label>
        <input name="thanks" value={intro.thanks} onChange={handleIntroChange} required />

        <button type="submit">Save Changes</button>
        {status && <p className="status">{status}</p>}
      </form>
    </div>
  );
}

/* ─── SKILLS SECTION ─── */
function SkillsSection() {
  const [skills, setSkills] = useState(getSkills());
  const [newSkill, setNewSkill] = useState("");
  const [description, setDescription] = useState("");
  const updateSkills = (updated) => { setSkills(updated); saveSkills(updated); };
  const addSkill = () => {
    if (!newSkill.trim()) return;
    updateSkills([{ id: Date.now(), skill_name: newSkill, description }, ...skills]);
    setNewSkill(""); setDescription("");
  };
  const deleteSkill = (id) => {
    if (!window.confirm("Delete this skill?")) return;
    updateSkills(skills.filter(s => s.id !== id));
  };
  return (
    <div className="skills-admin-wrapper">
      <h2>Manage Skills</h2>
      <div className="skill-form">
        <input placeholder="Skill name" value={newSkill} onChange={e => setNewSkill(e.target.value)} />
        <textarea placeholder="Skill description" value={description} onChange={e => setDescription(e.target.value)} />
        <button onClick={addSkill}>Add Skill</button>
      </div>
      <div className="skills-list">
        {skills.map(skill => (
          <div key={skill.id} className="skill-item">
            <div><strong>{skill.skill_name}</strong><p>{skill.description}</p></div>
            <button className="delete-btn" onClick={() => deleteSkill(skill.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── PROJECTS SECTION ─── */
const emptyForm = { title: "", description: "", images: [], video_url: "", github_url: "", app_url: "", has_app_url: false, tech_stack: "" };

function ProjectsSection() {
  const [projects, setProjects] = useState(getProjects());
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({ ...emptyForm, images: [] });

  const updateProjects = (updated) => { setProjects(updated); saveProjects(updated); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const resizeImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const W = 800, H = 320;
        const canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d");
        const scale = Math.max(W / img.width, H / img.height);
        const sw = W / scale, sh = H / scale;
        const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handleImageUpload = async (e) => {
    const slots = 3 - form.images.length;
    if (slots <= 0) return;
    const files = Array.from(e.target.files).slice(0, slots);
    const resized = await Promise.all(files.map(resizeImage));
    setForm(f => ({ ...f, images: [...f.images, ...resized] }));
    e.target.value = "";
  };

  const removeImage = (i) => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const saveProject = () => {
    if (!form.title || !form.description) return;
    const data = { ...form, app_url: form.has_app_url ? form.app_url : "" };
    if (editingId) {
      updateProjects(projects.map(p => p.id === editingId ? { ...p, ...data } : p));
      setStatus("Project updated ✅");
    } else {
      updateProjects([{ id: Date.now(), ...data }, ...projects]);
      setStatus("Project added ✅");
    }
    setForm({ ...emptyForm, images: [] });
    setEditingId(null);
    setTimeout(() => setStatus(""), 2500);
  };

  const deleteProject = (id) => {
    if (!window.confirm("Delete this project?")) return;
    updateProjects(projects.filter(p => p.id !== id));
    setStatus("Project deleted");
  };

  const editProject = (project) => {
    setForm({
      title: project.title,
      description: project.description,
      images: project.images?.length ? project.images : (project.image_url ? [project.image_url] : []),
      video_url: project.video_url || "",
      github_url: project.github_url || "",
      app_url: project.app_url || "",
      has_app_url: !!project.app_url,
      tech_stack: project.tech_stack || ""
    });
    setEditingId(project.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="projects-admin-wrapper">
      <h2>Manage Projects</h2>
      <div className="project-form">
        <input name="title" placeholder="Project Title" value={form.title} onChange={handleChange} />
        <textarea name="description" placeholder="Project Description" value={form.description} onChange={handleChange} />

        {/* MULTI IMAGE UPLOAD */}
        <label className="upload-label">
          Project Images ({form.images.length}/3)
          {form.images.length < 3 && (
            <>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="file-input" />
              <span className="upload-btn">📁 Add Images</span>
            </>
          )}
        </label>

        {form.images.length > 0 && (
          <div className="image-preview-row">
            {form.images.map((src, i) => (
              <div key={i} className="preview-thumb">
                <img src={src} alt={`img-${i}`} />
                <button className="remove-img" onClick={() => removeImage(i)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <input name="video_url" placeholder="Video URL (optional)" value={form.video_url} onChange={handleChange} />
        <input name="github_url" placeholder="GitHub Repo URL" value={form.github_url} onChange={handleChange} />
        <input name="tech_stack" placeholder="Tech Stack (React, Node, SQL)" value={form.tech_stack} onChange={handleChange} />

        <label className="checkbox-label">
          <input type="checkbox" name="has_app_url" checked={form.has_app_url} onChange={handleChange} />
          Has Live App URL?
        </label>
        {form.has_app_url && (
          <input name="app_url" placeholder="Live App URL" value={form.app_url} onChange={handleChange} />
        )}

        <button onClick={saveProject}>{editingId ? "Update Project" : "Add Project"}</button>
        {status && <p className="status">{status}</p>}
      </div>

      <div className="projects-list">
        {projects.map(project => {
          const imgs = project.images?.length ? project.images : (project.image_url ? [project.image_url] : []);
          return (
            <div key={project.id} className="project-item">
              {imgs.length > 0 && <Carousel images={imgs} />}
              <div className="project-info">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <small>{project.tech_stack}</small>
                {project.app_url && (
                  <a href={project.app_url} target="_blank" rel="noreferrer" className="app-url-badge">🌐 Live App</a>
                )}
                <div className="project-actions">
                  <button onClick={() => editProject(project)}>Edit</button>
                  <button className="delete-btn" onClick={() => deleteProject(project.id)}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── MAIN ADMIN PAGE ─── */
function Admin() {
  const [activeTab, setActiveTab] = useState("profile");
  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "messages", label: "Messages" }
  ];
  return (
    <LoginGate>
      <div className="admin-wrapper">
        <h2 className="admin-title">Admin Dashboard</h2>
        <div className="admin-menu">
          {tabs.map(tab => (
            <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="admin-content fade-in">
          {activeTab === "profile" && <ProfileSection />}
          {activeTab === "skills" && <SkillsSection />}
          {activeTab === "projects" && <ProjectsSection />}
          {activeTab === "messages" && (
            <div className="table-wrapper">
              {staticMessages.length === 0 ? <p>No messages found</p> : (
                <table className="admin-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Date</th></tr></thead>
                  <tbody>
                    {staticMessages.map(msg => (
                      <tr key={msg.id}>
                        <td>{msg.name}</td><td>{msg.email}</td><td>{msg.message}</td>
                        <td>{new Date(msg.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </LoginGate>
  );
}

export default Admin;
