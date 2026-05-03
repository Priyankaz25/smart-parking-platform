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
      <div className="navbar-brand" onClick={() => navigate("/")}>
        ParkNest
      </div>

      <nav className="navbar-links">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="navbar-session">
        {session?.user?.name ? (
          <>
            <span className="session-name">Hi, {session.user.name}</span>
            <button type="button" className="btn btn-outline" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => navigate("/auth")}>
            Login / Register
          </button>
        )}
      </div>
    </header>
  );
}

export default Navbar;
