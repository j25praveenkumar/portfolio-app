import { useState } from "react";
import emailjs from "@emailjs/browser";
import "./Contact.css";

// ── EmailJS config ──────────────────────────────────────────────
const EMAILJS_SERVICE_ID = "service_wphuorh";
const EMAILJS_TEMPLATE_ID = "template_wf8up2j";
const EMAILJS_PUBLIC_KEY = "7vK1ZJ8IjYve4_WZe";
// ───────────────────────────────────────────────────────────────

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus("");
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          from_email: form.email,
          message: form.message,
          to_email: "praveenkumargovindharaj025@gmail.com",
        },
        EMAILJS_PUBLIC_KEY
      );
      setStatus("✅ Message sent! I'll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("❌ Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="contact-section">

      <h2 className="section-title">Let's Connect 🤝</h2>
      <p className="contact-subtitle">
        Feel free to reach out. I'm always happy to chat! 😊
      </p>

      <div className="contact-container">

        {/* CONTACT INFO */}
        <div className="contact-info">

          <div className="contact-item">
            <span>💻</span>
            <a href="https://github.com/j25praveenkumar" target="_blank">
              GitHub
            </a>
          </div>

          <div className="contact-item">
            <span>🔗</span>
            <a href="https://www.linkedin.com/in/praveenkumar-govindaraj/" target="_blank">
              LinkedIn
            </a>
          </div>

          <div className="contact-item">
            <span>📧</span>
            <a href="mailto:praveenkumargovindharaj025@gmail.com">
              praveenkumargovindharaj025@gmail.com
            </a>
          </div>

          <div className="contact-item">
            <span>📱</span>
            <a href="tel:9789926026">+91 97899 26026</a>
          </div>

        </div>

        {/* CHAT STYLE FORM */}
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="chat-bubble">👋 Hi there! Send me a message.</div>

          <input
            name="name"
            placeholder="Your Name 😊"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Your Email 📧"
            value={form.email}
            onChange={handleChange}
            required
          />

          <textarea
            name="message"
            placeholder="Type your message here... 💬"
            value={form.message}
            onChange={handleChange}
            required
          />

          <button className="send-btn" disabled={sending}>
            {sending ? "Sending..." : "Send Message 🚀"}
          </button>

          {status && <p className="status">{status}</p>}
        </form>

      </div>
    </section>
  );
}

export default Contact;
