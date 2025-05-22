import React, { useState, useEffect } from "react"; 
import { Outlet, useNavigate, useLocation } from "react-router-dom"; 
import axios from "axios"; 
 
function StudentLayout() { 
  const [student, setStudent] = useState({}); 
  const navigate = useNavigate(); 
  const location = useLocation(); 
  const [expanded, setExpanded] = useState(false);
 
  useEffect(() => { 
    const fetchStudentProfile = async () => { 
      const token = localStorage.getItem("token"); 
      try { 
        const response = await axios.get("http://localhost:5000/student/profile", { 
          headers: { 
            Authorization: `Bearer ${token}`, 
          }, 
        }); 
        setStudent(response.data.student); 
      } catch (error) { 
        console.error("Error fetching student profile:", error); 
        // If unauthorized, redirect to login 
        if (error.response && error.response.status === 401) { 
          localStorage.removeItem("token"); 
          navigate("/"); 
        } 
      } 
    }; 
 
    fetchStudentProfile(); 
  }, [navigate]); 
 
  const handleLogout = () => { 
    localStorage.removeItem("token"); 
    navigate("/"); 
  }; 
 
  const isActive = (path) => { 
    return location.pathname === `/student/${path}`; 
  }; 
  
  // Toggle navbar collapse on mobile
  const toggleNavbar = () => {
    setExpanded(!expanded);
  };
 
  return ( 
    <div className="container-fluid p-0">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: "#198754" }}>
        <div className="container">
          <a className="navbar-brand" href="#"></a>
          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={toggleNavbar}
            aria-controls="navbarNav" 
            aria-expanded={expanded ? "true" : "false"} 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${expanded ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <button 
                  className={`nav-link btn ${isActive("dashboard") ? "active fw-bold" : ""}`} 
                  onClick={() => navigate("/student/dashboard")}
                >
                  My Profile
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn ${isActive("appointment") ? "active fw-bold" : ""}`} 
                  onClick={() => navigate("/student/appointment")}
                >
                  Request Appointment
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn ${isActive("appointment-status") ? "active fw-bold" : ""}`} 
                  onClick={() => navigate("/student/appointment-status")}
                >
                  My Appointments
                </button>
              </li>
            </ul>
            <div className="d-flex">
              <span className="navbar-text me-3">
                {student.firstname ? `Welcome, ${student.firstname}` : ''}
              </span>
              <button 
                className="btn btn-outline-light" 
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="container mt-4">
        <Outlet />
      </div>
    </div>
  ); 
} 
 
export default StudentLayout;