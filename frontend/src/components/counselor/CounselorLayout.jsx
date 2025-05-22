import React, { useState, useEffect } from "react";
import axios from "axios";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

function CounselorLayout() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.includes(`/counselor/${path}`);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/counselor/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data.counselor);
      } catch (error) {
        console.error(error);
        navigate("/");
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {/* SIDEBAR */}
        <div className="col-md-2 text-white vh-100 sidebar sidebar">
          <h4 className="text-center mt-4">Counselor Panel</h4>
          <div className="d-flex flex-column align-items-center mt-4">
            <button
              className={`btn fw-bold w-75 my-2 ${isActive("dashboard") ? "btn-success" : "btn-outline-light"}`}
              onClick={() => navigate("/counselor/dashboard")}
            >
              Dashboard
            </button>
            <button className={`btn fw-bold w-75 my-2 ${isActive("students") ? "btn-success" : "btn-outline-light"}`}
              onClick={() => navigate("/counselor/students")}>
              List of Students
            </button>
            <button className={`btn fw-bold w-75 my-2 ${isActive("assign") ? "btn-success" : "btn-outline-light"}`}
              onClick={() => navigate("/counselor/assign")}>
              Assign Students
            </button>
            <button className={`btn fw-bold w-75 my-2 ${isActive("appointments") ? "btn-success" : "btn-outline-light"}`}
              onClick={() => navigate("/counselor/appointments")}>
              Online Appointments
            </button>
            <button className={`btn fw-bold w-75 my-2 ${isActive("schedule") ? "btn-success" : "btn-outline-light"}`}
              onClick={() => navigate("/counselor/schedule")}>
              Appointment Schedule
            </button>
            <button className="btn btn-outline-danger fw-bold w-75 mt-3"
              onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        
        {/* MAIN CONTENT (just for structure) */}
        <div className="col-md-10 p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default CounselorLayout;
