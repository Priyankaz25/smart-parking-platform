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
  <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-10">
    <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden grid md:grid-cols-2">
      
      {/* Left section */}
      <div className="hidden md:flex flex-col justify-between bg-white p-12 border-r border-slate-100">
        <div>
          <div className="text-4xl font-bold text-emerald-600 mb-10">P</div>
          <h1 className="text-4xl font-semibold text-slate-900 leading-tight mb-6">
            Smart parking made simple.
          </h1>
          <p className="text-lg text-slate-500 leading-8">
            Sign in or create an account to book parking spaces,
            manage listings, and track reservations with ParkNest.
          </p>
        </div>

        <p className="text-sm text-slate-400">
          By continuing, you agree to our Terms & Privacy Policy.
        </p>
      </div>

      {/* Right section */}
      <div className="p-10 md:p-14">
        <h2 className="text-3xl font-semibold text-slate-900 mb-8">
          {isSignup ? "Create account" : "Welcome back"}
        </h2>

        <form onSubmit={onSubmit} className="space-y-5">
          {isSignup && (
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => onFieldChange("name", e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => onFieldChange("password", e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <select
            value={form.role}
            onChange={(e) => onFieldChange("role", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-4 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="user">Driver</option>
            <option value="owner">Parking Owner</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 text-white py-4 font-semibold hover:bg-emerald-700 transition"
          >
            {loading ? "Please wait..." : isSignup ? "Create account" : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsSignup((s) => !s)}
          className="w-full mt-4 rounded-xl border border-slate-200 py-4 font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          {isSignup
            ? "Already have an account? Login"
            : "New user? Register"}
        </button>
      </div>
    </div>
  </div>
);
}

export default AuthPage;
