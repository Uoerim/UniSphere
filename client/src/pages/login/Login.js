import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest, validateToken } from "../../services/authServices";
import "./login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 🔥 Check token on mount using backend + protect middleware
  useEffect(() => {
    const checkExistingToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // no token → stay on login

      try {
        const res = await validateToken(token);

        if (res.valid) {
          navigate("/dashboard");
        } else {
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.log("Token validation error:", err);
        localStorage.removeItem("token");
      }
    };

    checkExistingToken();
  }, [navigate]);

  const handleClick = async () => {
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await loginRequest(username, password);

      if (res.success) {
        localStorage.setItem("token", res.token);
        navigate("/dashboard");
      } else {
        setError(res.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left"></div>
      <div className="login-form">
        <div className="login-logo">
          <img src="/Logo.png" alt="Logo" />
          <h2>Lighting the path to your future.</h2>
        </div>

        <input
          type="text"
          placeholder="Username"
          className="form-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="error-text">{error}</p>}

        <button
          type="button"
          className="form-button"
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
};

export default Login;
