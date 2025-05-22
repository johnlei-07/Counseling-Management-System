import React, { useState, useEffect } from "react";
import axios from "axios";

function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filter, setFilter] = useState("all"); // "all", "pending", "approved", "rejected"

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/counselor/appointments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Appointments data:", response.data);
      setAppointments(response.data.appointments || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Failed to load appointments. Please try again later.");
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/counselor/appointments/${appointmentId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccessMessage(`Appointment ${newStatus.toLowerCase()} successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
      
      // Update the local state
      setAppointments(appointments.map(app => 
        app._id === appointmentId ? { ...app, status: newStatus } : app
      ));
    } catch (error) {
      console.error("Error updating appointment:", error);
      setError("Failed to update appointment status. Please try again.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString; // Return the original string if parsing fails
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning text-dark';
      case 'approved':
        return 'bg-success text-white';
      case 'rejected':
        return 'bg-danger text-white';
      case 'completed':
        return 'bg-info text-dark';
      case 'failed to attend':
        return 'bg-dark text-light';
      default:
        return 'bg-dark text-light';
    }
  };

  // Filter appointments based on selected filter
  const filteredAppointments = filter === 'all' 
    ? appointments 
    : appointments.filter(app => app.status === filter);

  return (
    <div className="container mt-4">
      <h2>Appointment Requests</h2>
      
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="row mb-3">
        <div className="col-md-4">
          <label htmlFor="statusFilter" className="form-label">Filter by Status</label>
          <select 
            id="statusFilter"
            className="form-select" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Appointments</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="failed to attend">Failed to attend</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="alert alert-info">No appointment requests found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="table-primary">
              <tr>
                <th>Student Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Email</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Requested On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td>{appointment.student_name || "Student"}</td>
                  <td>{formatDate(appointment.appointment_date)}</td>
                  <td>{appointment.appointment_time || "N/A"}</td>
                  <td>{appointment.student_email || "N/A"}</td>
                  <td>{appointment.reason || "No reason provided"}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                      {appointment.status || "Pending"}
                    </span>
                  </td>
                  <td>{formatDate(appointment.created_at)}</td>
                  <td>
                    {appointment.status === 'pending' && (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatusChange(appointment._id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleStatusChange(appointment._id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {appointment.status !== 'pending' && (
                      <span className="text-muted">No actions available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AppointmentList;