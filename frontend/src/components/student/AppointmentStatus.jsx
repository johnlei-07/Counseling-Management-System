import React, { useState, useEffect } from "react";
import axios from "axios";

function AppointmentStatus() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/student/my-appointments", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(response.data.appointments);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setError("Failed to load your appointments. Please try again later.");
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="container mt-4">
      <h2>My Appointments</h2>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="alert alert-info">You have no appointment requests.</div>
      ) : (
        <div className="row">
          {appointments.map((appointment) => (
            <div className="col-md-6 mb-4" key={appointment._id}>
              <div className={`card ${
                appointment.status === 'pending' ? 'border-warning' :
                appointment.status === 'approved' ? 'border-success' :
                appointment.status === 'rejected' ? 'border-danger' : ''
              }`}>
                <div className={`card-header ${
                  appointment.status === 'pending' ? 'bg-warning text-dark' :
                  appointment.status === 'approved' ? 'bg-success text-white' :
                  appointment.status === 'rejected' ? 'bg-danger text-white' : ''
                }`}>
                  Status: {appointment.status || "Pending"}
                </div>
                <div className="card-body">
                  <p className="card-text">
                    <strong>Date:</strong> {formatDate(appointment.appointment_date)}<br />
                    <strong>Time:</strong> {appointment.appointment_time || "N/A"}<br />
                    <strong>Reason:</strong> {appointment.reason || "No reason provided"}
                  </p>
                  
                  {appointment.status === 'approved' && (
                    <div className="alert alert-success">
                      Your appointment has been approved! Please be on time.
                    </div>
                  )}
                  
                  {appointment.status === 'rejected' && (
                    <div className="alert alert-danger mb-1" style={{padding: "10px"}}>
                      Your appointment has been rejected. Please request a new appointment or contact your counselor.
                    </div>
                  )}
                  {appointment.status === 'pending' && (
                    <div className="alert alert-warning mb-1" style={{padding: "10px"}}>
                      Please wait to approve your request.
                    </div>
                  )}
                </div>
                <div className="card-footer text-muted">
                  Requested on: {formatDate(appointment.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AppointmentStatus;