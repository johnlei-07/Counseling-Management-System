import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function CounselorDashboard() {
  const [counselor, setCounselor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointmentStats, setAppointmentStats] = useState({
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    noShow: 0
  });

  useEffect(() => {
    fetchCounselorProfile();
    fetchAppointmentStats();
  }, []);

  const fetchCounselorProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/counselor/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCounselor(response.data.counselor);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching counselor profile:", error);
      setError("Failed to load counselor profile. Please try again later.");
      setLoading(false);
    }
  };

  const fetchAppointmentStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/counselor/appointments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const appointments = response.data.appointments || [];
      
      // Count appointments by status
      const stats = {
        pending: 0,
        approved: 0,
        completed: 0,
        rejected: 0,
        noShow: 0
      };
      
      appointments.forEach(appointment => {
        switch(appointment.status) {
          case 'pending':
            stats.pending++;
            break;
          case 'approved':
            stats.approved++;
            break;
          case 'completed':
            stats.completed++;
            break;
          case 'rejected':
            stats.rejected++;
            break;
          case 'failed to attend':
            stats.noShow++;
            break;
          default:
            break;
        }
      });
      
      setAppointmentStats(stats);
    } catch (error) {
      console.error("Error fetching appointment stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* <h2>Counselor Dashboard</h2>
      
      {counselor && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Welcome, {counselor.firstname} {counselor.lastname}</h5>
            <p className="card-text">Email: {counselor.email}</p>
          </div>
        </div>
      )} */}
      
      {/* Appointment Statistics Cards */}
      <h4 className="mb-4 text-center fs-2">Appointment Statistics</h4>
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card border border-warning border-3 text-dark h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <i className="bi bi-hourglass-split text-warning me-2" style={{ fontSize: "1.5rem" }}></i>
                <h5 className="card-title mb-0">Pending</h5>
              </div>
              <div className="text-center">
                <h1 className="display-4">{appointmentStats.pending}</h1>
              </div>
            </div>
            <div className="card-footer bg-warning border-top border-light">
              <Link to="/counselor/appointments" className="text-white text-decoration-none">
                View Pending Appointments <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card border border-success border-3 text-dark h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <i className="bi bi-check-circle-fill text-success me-2" style={{ fontSize: "1.5rem" }}></i>
                <h5 className="card-title mb-0">Approved</h5>
              </div>
              <div className="text-center">
                <h1 className="display-4">{appointmentStats.approved}</h1>
              </div>
            </div>
            <div className="card-footer bg-success border-top border-light">
              <Link to="/counselor/appointments" className="text-white text-decoration-none">
                View Approved Appointments <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card border border-info border-3 text-dark h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <i className="bi bi-clipboard-check text-info me-2" style={{ fontSize: "1.5rem" }}></i>
                <h5 className="card-title mb-0">Completed</h5>
              </div>
              <div className="text-center">
                <h1 className="display-4">{appointmentStats.completed}</h1>
              </div>
            </div>
            <div className="card-footer bg-info border-top border-light">
              <Link to="/counselor/appointments" className="text-white text-decoration-none">
                View Completed Sessions <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card border border-dark border-3 border-2 text-dark h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <i className="bi bi-person-x-fill text-dark me-2" style={{ fontSize: "1.5rem" }}></i>
                <h5 className="card-title mb-0">Failed to attend</h5>
              </div>
              <div className="text-center">
                <h1 className="display-4">{appointmentStats.noShow}</h1>
              </div>
            </div>
            <div className="card-footer bg-dark border-top border-light">
              <Link to="/counselor/appointments" className="text-white text-decoration-none">
                View Failed to attend Appointments <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card border border-danger border-3 text-dark h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <i className="bi bi-x-circle-fill text-danger me-2" style={{ fontSize: "1.5rem" }}></i>
                <h5 className="card-title mb-0">Rejected</h5>
              </div>
              <div className="text-center">
                <h1 className="display-4">{appointmentStats.rejected}</h1>
              </div>
            </div>
            <div className="card-footer bg-danger border-top border-light">
              <Link to="/counselor/appointments" className="text-white text-decoration-none">
                View Rejected Appointments <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CounselorDashboard;