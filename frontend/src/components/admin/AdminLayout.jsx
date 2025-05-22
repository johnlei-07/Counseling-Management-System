import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import './admin.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === `/admin/${path}`;

  // Add this function to handle logout
  const handleLogout = () => {
  if (window.confirm("Are you sure you want to logout?")) {
    // Clear the token from localStorage
    localStorage.removeItem("token");
    // Redirect to login page
    window.location.href = "/";
  }
};

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="sidebar text-white p-3 vh-100" style={{ width: "250px" }}>
        <h4 className="text-center mb-4 mt-3">Admin Panel</h4>
        <button className={`btn w-100 my-2 fw-bold ${isActive("dashboard-stats") ? "btn-success" : "btn-outline-light"}`}
          onClick={() => navigate("/admin/dashboard-stats")}
          >
          Dashboard
        </button>
        <button
          className={`btn w-100 my-2  fw-bold ${isActive("create-counselor") ? "btn-success" : "btn-outline-light"}`}
          onClick={() => navigate("/admin/create-counselor")}
        >
          Add Counselor
        </button>
        <button
          className={`btn w-100 my-2 fw-bold ${isActive("list-counselors") ? "btn-success" : "btn-outline-light"}`}
          onClick={() => navigate("/admin/list-counselors")}
        >
          List of Counselors
        </button>
        <button
          className={`btn w-100 my-2 fw-bold ${isActive("studentlist") ? "btn-success" : "btn-outline-light"}`}
          onClick={() => navigate("/admin/studentlist")}
        >
          List of Students
        </button>
        <button
          className={`btn w-100 my-2 fw-bold ${isActive("handleLogout") ? "btn-success" : "btn-outline-light"}`}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-4 w-100">
        <Outlet /> {/* ⬅ This is where nested routes render */}
      </div>
    </div>
  );
}

export default AdminDashboard;

