import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // close menu on route change
  useEffect(() => { setOpen(false); }, [location]);

  // lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="logo">
          <Link to="/"><span>Praveen</span></Link>
          <Link to="/admin" className="logo-admin"><span>kumar.dev</span></Link>
        </div>

        {/* Desktop links */}
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        {/* Hamburger */}
        <button
          className={`hamburger${open ? " open" : ""}`}
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`mobile-menu${open ? " open" : ""}`}>
        <Link to="/">Home</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/contact">Contact</Link>
      </div>
    </header>
  );
}

export default Navbar;
