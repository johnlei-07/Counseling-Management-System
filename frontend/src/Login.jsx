import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // Add Link here
import logo from "./img/logo.png";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./Login.css"

function Login() {
  // At the top with your other state variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(""); // Add this line
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });

      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
      }

      if (response.data.role === "admin") {
        navigate("/admin/dashboard-stats");
      } else if (response.data.role === "counselor") {
        navigate("/counselor/dashboard");
      } else if (response.data.role === "student") {
        navigate("/student/dashboard");
      }

    } catch (error) {
      if (error.response) {
        setMessage(`Error: ${error.response.data.error}`);
      } else {
        setMessage("Error: Could not connect to server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="d-flex justify-content-center align-items-center mt-4 " > 
      <div className="p-5 shadow rounded border border-success bg-white" style={{ maxWidth: "550px", width: "450px" }}>
        <div className="text-center mb-4">
          <img src={logo} alt="School Logo" className="img-fluid w-75 border border-success" style={{ maxHeight: "120px" }} />
          <h2 className="mt-3">Healing Hearts,</h2>
          <h2>Building Futures</h2>
          <p className="text-muted">Sign in to access your account</p>
        </div>

        <div className="card-body">
          {message && message.includes("Error") && <div className="alert alert-danger">{message}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                type="email"
                className="form-control border border-success"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                className="form-control border border-success"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
          
          {/* Add this new section for student registration */}
          <div className="mt-3 text-center">
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
