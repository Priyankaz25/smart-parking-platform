import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../services/session";

const navLinks = [
  { to: "/", label: "Find Parking" },
  { to: "/dashboard/user", label: "User Dashboard" },
  { to: "/dashboard/owner", label: "Owner Dashboard" },
  { to: "/dashboard/admin", label: "Admin Dashboard" },
];

function Navbar() {
  const navigate = useNavigate();
  const session = getSession();

  const onLogout = () => {
    clearSession();
    navigate("/auth");
  };

  return (
  <header className="navbar">
    <div className="navbar-container">
      
      {/* LEFT */}
      <div className="navbar-left" onClick={() => navigate("/")}>
        <span className="brand-icon">P</span>
        <span className="brand-text">ParkNest</span>
      </div>

      {/* CENTER */}
      <nav className="navbar-center">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* RIGHT */}
      <div className="navbar-right">
        {session?.user?.name ? (
          <>
            <span className="session-name">
              👋 {session.user.name}
            </span>
            <button className="btn logout-btn" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <button
            className="btn login-btn"
            onClick={() => navigate("/auth")}
          >
            Login / Register
          </button>
        )}
      </div>

    </div>
  </header>
);
}

export default Navbar;
