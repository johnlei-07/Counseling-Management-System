import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AppointmentSchedule() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [groupedAppointments, setGroupedAppointments] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(""); // Add this state for status filter
  const [remarkText, setRemarkText] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showRemarksModal, setShowRemarksModal] = useState(false); // Add this state
  
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/counselor/appointments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const appointmentsData = response.data.appointments || [];
      setAppointments(appointmentsData);
      
      // Group appointments by date
      const grouped = groupAppointmentsByDate(appointmentsData);
      setGroupedAppointments(grouped);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Failed to load appointments. Please try again later.");
      setLoading(false);
    }
  };

  // Group appointments by date and sort by time
  const groupAppointmentsByDate = (appointments) => {
    const grouped = {};
    
    appointments.forEach(appointment => {
      // Skip appointments that don't have a date or are rejected
      if (!appointment.appointment_date || appointment.status === 'rejected') return;
      
      // Format the date as a key
      const dateKey = formatDateKey(appointment.appointment_date);
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(appointment);
    });
    
    // Sort appointments by time within each date group
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        return a.appointment_time.localeCompare(b.appointment_time);
      });
    });
    
    return grouped;
  };

  // Format date for grouping (YYYY-MM-DD)
  const formatDateKey = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return dateString;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'bg-success';
      case 'pending': return 'bg-warning text-dark';
      case 'rejected': return 'bg-danger';
      case 'completed': return 'bg-info';
      case 'failed to attend': return 'bg-dark';
      default: return 'bg-secondary';
    }
  };

  // Handle date selection
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // // Filter appointments by selected date
  // const filteredDates = selectedDate 
  //   ? Object.keys(groupedAppointments).filter(date => date === selectedDate)
  //   : Object.keys(groupedAppointments);

  // Add this function to handle status changes
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
      
      setSuccessMessage(`Appointment marked as ${newStatus} successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
      
      // Update the local state
      setAppointments(appointments.map(app => 
        app._id === appointmentId ? { ...app, status: newStatus } : app
      ));
      
      // Update the grouped appointments
      const updatedGrouped = groupAppointmentsByDate(
        appointments.map(app => 
          app._id === appointmentId ? { ...app, status: newStatus } : app
        )
      );
      setGroupedAppointments(updatedGrouped);
      
      // If marking as completed, open the remarks modal
      if (newStatus === 'completed') {
        setSelectedAppointment(appointmentId);
        setShowRemarksModal(true); // Show modal using state
      }
      
    } catch (error) {
      console.error("Error updating appointment:", error);
      setError(`Failed to update appointment status: ${error.response?.data?.message || error.message}`);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Add function to handle adding remarks
  const handleAddRemark = async () => {
    if (!remarkText.trim() || !selectedAppointment) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/counselor/appointments/${selectedAppointment}/remarks`,
        { remark: remarkText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage("Remark added successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      
      // Clear the remark text and selected appointment
      setRemarkText("");
      setSelectedAppointment(null);
      
      // Close the modal using state
      setShowRemarksModal(false);
      
      // Refresh appointments to show updated data
      fetchAppointments();
    } catch (error) {
      console.error("Error adding remark:", error);
      setError(`Failed to add remark: ${error.response?.data?.message || error.message}`);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Add this function to handle status filter change
  const handleStatusFilterChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  // Filter appointments by selected date and status
  const filteredDates = Object.keys(groupedAppointments).filter(dateKey => {
    // First filter by date if selected
    if (selectedDate && dateKey !== selectedDate) {
      return false;
    }
    
    // Then check if any appointments on this date match the selected status
    if (selectedStatus) {
      return groupedAppointments[dateKey].some(app => app.status === selectedStatus);
    }
    
    return true;
  });

  return (
    <div className="container mt-4">
      <h2>Appointment Schedule</h2>
      
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      
      {/* Date and Status Search Bar */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <label htmlFor="dateFilter" className="form-label">Filter by Date:</label>
              <input
                type="date"
                id="dateFilter"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="statusFilter" className="form-label">Filter by Status:</label>
              <select
                id="statusFilter"
                className="form-select"
                value={selectedStatus}
                onChange={handleStatusFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="failed to attend">Failed to attend</option>
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button 
                className="btn btn-secondary me-2" 
                onClick={() => {
                  setSelectedDate("");
                  setSelectedStatus("");
                }}
                disabled={!selectedDate && !selectedStatus}
              >
                Clear Filters
              </button>
              <button 
                className="btn btn-primary" 
                onClick={fetchAppointments}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filteredDates.length === 0 ? (
        <div className="alert alert-info">
          {selectedDate && selectedStatus
            ? `No ${selectedStatus} appointments found for ${formatDate(selectedDate)}.`
            : selectedDate
              ? `No appointments found for ${formatDate(selectedDate)}.`
              : selectedStatus
                ? `No ${selectedStatus} appointments found.`
                : "No upcoming appointments found."}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead className="table-primary">
              <tr>
                <th style={{width: "20%"}}>Date</th>
                <th style={{width: "15%"}}>Time</th>
                <th style={{width: "25%"}}>Student</th>
                <th style={{width: "25%"}}>Reason</th>
                <th style={{width: "15%"}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDates
                .sort((a, b) => new Date(a) - new Date(b))
                .map(dateKey => {
                  const formattedDate = formatDate(dateKey);
                  // Filter appointments by status if selected
                  const filteredAppointments = selectedStatus
                    ? groupedAppointments[dateKey].filter(app => app.status === selectedStatus)
                    : groupedAppointments[dateKey];
                    
                  return filteredAppointments.map((appointment, index) => (
                    <tr key={appointment._id}>
                      {/* Only show date in first row of each date group */}
                      {index === 0 ? (
                        <td 
                          rowSpan={filteredAppointments.length} 
                          className="align-middle bg-light fw-bold"
                        >
                          {formattedDate}
                        </td>
                      ) : null}
                      
                      {/* ... existing code ... */}
                      <td className="fw-bold">{appointment.appointment_time}</td>
                      <td>
                        {appointment.student_name || "Unknown Student"}
                        <br />
                        <small className="text-muted">{appointment.student_email}</small>
                      </td>
                      <td>{appointment.reason}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status || "Pending"}
                        </span>
                        
                        {appointment.status === 'approved' && (
                          <div className="mt-2">
                            <button 
                              className="btn btn-sm btn-outline-primary me-1 m-1" 
                              onClick={() => handleStatusChange(appointment._id, 'completed')}
                            >
                              Mark Complete
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-dark me-1 m-1" 
                              onClick={() => handleStatusChange(appointment._id, 'failed to attend')}
                            >
                              Failed to Attend
                            </button>
                          </div>
                        )}
                      
                        {appointment.status === 'completed' && !appointment.remarks && (
                          <div className="mt-2">
                            <button 
                              className="btn btn-sm btn-outline-primary" 
                              onClick={() => {
                                setSelectedAppointment(appointment._id);
                                setShowRemarksModal(true); // Use state instead of bootstrap
                              }}
                            >
                              Add Remarks
                            </button>
                          </div>
                        )}
                        
                        {appointment.remarks && (
                          <div className="mt-2">
                            {/* <button 
                              className="btn btn-sm btn-outline-secondary" 
                              data-bs-toggle="collapse" 
                              data-bs-target={`#remarks-${appointment._id}`}
                            >
                              View Remarks
                            </button> */}
                            <div className="collapse mt-2" id={`remarks-${appointment._id}`}>
                              <div className="card card-body bg-light">
                                <small>{appointment.remarks}</small>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ));
                })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Remarks Modal - Updated to use React state */}
      <div className={`modal fade ${showRemarksModal ? 'show' : ''}`} 
           id="remarksModal" 
           tabIndex="-1" 
           aria-labelledby="remarksModalLabel" 
           aria-hidden="true"
           style={{ display: showRemarksModal ? 'block' : 'none' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="remarksModalLabel">Add Session Remarks</h5>
              <button type="button" className="btn-close" onClick={() => setShowRemarksModal(false)} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="remarkText" className="form-label">Counseling Session Notes</label>
                <textarea 
                  className="form-control" 
                  id="remarkText" 
                  rows="5" 
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Enter notes about the counseling session..."
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowRemarksModal(false)}>Close</button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleAddRemark}
                disabled={!remarkText.trim()}
              >
                Save Remarks
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Add backdrop when modal is shown */}
      {showRemarksModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default AppointmentSchedule;