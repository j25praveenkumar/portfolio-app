# 🚀 Praveenkumar.dev — Personal Portfolio

A dynamic personal portfolio web application built with **React + Vite**, featuring a fluid WebGL background, admin dashboard, project showcase, and contact form with email integration.

---

## ✨ Features

- **Fluid WebGL Background** — Interactive cursor-reactive animation (Toukoum-style Navier-Stokes fluid simulation)
- **Hero Section** — Animated gradient title with floating card effect
- **Skills Section** — Dynamically managed skill cards
- **Projects Showcase** — Image carousel per project, live app badges, GitHub links
- **Contact Form** — EmailJS integration, sends directly to Gmail inbox
- **Admin Dashboard** — Password-protected panel to manage profile, skills, and projects
- **Local Storage** — All data persists in the browser, no backend required
- **Fully Responsive** — Mobile-first design with hamburger navigation

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Styling | CSS3 (custom, no UI library) |
| Routing | React Router v6 |
| Email | EmailJS |
| Storage | localStorage (static, no backend) |
| Font | Inter (Google Fonts) |
| Background | WebGL (custom fluid simulation) |

---

## 📁 Project Structure

```
portfolio-app/
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx        # Responsive navbar with hamburger
    │   │   ├── Hero.jsx
    │   │   ├── Projects.jsx      # Project cards with carousel
    │   │   ├── Contact.jsx       # EmailJS contact form
    │   │   └── LivelyBackground.jsx  # WebGL fluid simulation
    │   ├── pages/
    │   │   ├── Home.jsx          # Landing page
    │   │   ├── ProjectsPage.jsx
    │   │   ├── ContactPage.jsx
    │   │   └── Admin.jsx         # Password-protected admin panel
    │   ├── data.js               # Default static data + password hash
    │   ├── store.js              # localStorage read/write helpers
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## 🔐 Admin Panel

Access the admin dashboard by clicking **`kumar.dev`** in the navbar logo.

- Password is stored as a **SHA-256 hash** in `data.js` — never plain text
- Session persists via `sessionStorage` (clears on browser close)
- Manage profile info, skills, and projects from the dashboard

---

## 📧 Contact Form

Powered by [EmailJS](https://emailjs.com) — no backend required.

Messages submitted through the contact form are delivered directly to the Gmail inbox via EmailJS SMTP integration.

---

## 📱 Responsive Design

- Desktop, tablet, and mobile layouts
- Hamburger menu on screens ≤ 640px
- Single-column grids on mobile
- Touch-friendly card interactions

---

## 🚀 Deployment

This is a pure static frontend — deploy anywhere:

- **Vercel** — `vercel deploy`
- **Netlify** — drag and drop the `dist/` folder
- **GitHub Pages** — push the `dist/` folder to `gh-pages` branch

---

## 👤 Author

**Praveenkumar Govindaraj**

- GitHub: [@j25praveenkumar](https://github.com/j25praveenkumar)
- LinkedIn: [praveenkumar-govindaraj](https://www.linkedin.com/in/praveenkumar-govindaraj/)
- Email: praveenkumargovindharaj025@gmail.com

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
