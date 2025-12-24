import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";
import styles from "./Login.module.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["login-container"]}>
      {/* Left Panel - Form */}
      <div className={styles["login-left"]}>
        <div className={styles["login-content"]}>
          <img
            src="/UniSphere-Logo-GREEN.png"
            alt="UniSphere Logo"
            className={styles["UniSphere-Logo"]}
          />

          <h1 className={styles.title}>
            UniSphere
          </h1>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles["login-form"]}>
            {error && (
              <div className={styles["error-message"]}>
                {error}
              </div>
            )}

            <div className={styles["input-group"]}>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={styles["form-input"]}
                required
                disabled={isLoading}
              />
            </div>

            <div
              className={`${styles["input-group"]} ${styles["password-group"]}`}
            >
              <input
                required
                disabled={isLoading}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={styles["form-input"]}
              />

              <button
                type="button"
                className={styles["password-toggle"]}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>

            <button type="submit" className={styles["submit-btn"]} disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className={styles["login-right"]}>
        <div className={styles["image-container"]}>
        </div>
      </div>
    </div>
  );
}
