import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { login, signup } from "../services/api";
import { saveSession } from "../services/session";

function AuthPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const onFieldChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        await signup({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        showToast("Registration successful. Please log in.", "success");
        setIsSignup(false);
      } else {
        const data = await login({
          email: form.email,
          password: form.password,
        });
        saveSession({
          token: data.token,
          role: data.user.role,
          user: data.user,
        });
        showToast("Welcome to ParkNest", "success");
        navigate(
          data.user.role === "owner"
            ? "/dashboard/owner"
            : data.user.role === "admin"
            ? "/dashboard/admin"
            : "/dashboard/user"
        );
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap narrow">
      <section className="auth-card">
        <h2>{isSignup ? "Create your account" : "Sign in to ParkNest"}</h2>
        <form onSubmit={onSubmit}>
          {isSignup && (
            <label>
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                required
              />
            </label>
          )}
          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => onFieldChange("password", event.target.value)}
              required
            />
          </label>
          <label>
            <span>{isSignup ? "Register as" : "Login as"}</span>
            <select value={form.role} onChange={(event) => onFieldChange("role", event.target.value)}>
              <option value="user">Driver</option>
              <option value="owner">Parking Owner</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          {!isSignup && (
            <label>
              <span>Note</span>
              <input value="Role is validated from backend profile" readOnly />
            </label>
          )}
          <button type="submit" className="btn btn-primary full" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Register" : "Login"}
          </button>
        </form>
        <button type="button" className="btn btn-outline full" onClick={() => setIsSignup((s) => !s)}>
          {isSignup ? "Already have an account? Login" : "New user? Register"}
        </button>
      </section>
    </div>
  );
}

export default AuthPage;
