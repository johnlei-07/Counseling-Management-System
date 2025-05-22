import React, { useState, useEffect } from "react";
import axios from "axios";

function RequestAppointment() {
  const [loading, setLoading] = useState(false);
  const [counselor, setCounselor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Define holidays (could be fetched from an API or database)
  const holidays = [
    "2023-12-25", // Christmas
    "2024-01-01", // New Year
    // Add other holidays
  ];

  useEffect(() => {
    const fetchAssignedCounselor = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/student/assigned-counselor", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCounselor(response.data.counselor);
      } catch (error) {
        console.error("Error fetching assigned counselor:", error);
        // Check if the error is specifically about no counselor being assigned
        if (error.response && error.response.status === 404 && 
            error.response.data.message === "No counselor assigned to your course/year") {
          setErrorMessage("No counselor assigned to your course/year");
        } else {
          setErrorMessage("Could not fetch your assigned counselor. Please try again later.");
        }
      }
    };

    fetchAssignedCounselor();
  }, []);

  // Validate the selected date
  const validateDate = (dateStr) => {
    if (!dateStr) return "Please select a date";
    
    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    
    const dayOfWeek = selectedDate.getDay();
    
    // Past date check
    if (selectedDate < today) {
      return "Please select a future date. Past dates are not available for appointments.";
    }
    
    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return "Appointments are not available on weekends. Please select a weekday.";
    }
    
    // Date range check
    if (selectedDate > maxDate) {
      return "Appointments can only be scheduled up to 30 days in advance.";
    }
    
    // Holiday check
    if (holidays.includes(dateStr)) {
      return "The selected date is a holiday. Counseling services are not available.";
    }
    
    return null; // No validation errors
  };

  // Handle date change with validation
  const handleDateChange = (e) => {
    const dateStr = e.target.value;
    const validationError = validateDate(dateStr);
    
    if (validationError) {
      setErrorMessage(validationError);
      setAppointmentDate(dateStr); // Still update the date even if invalid
      return;
    }
    
    setAppointmentDate(dateStr);
    setErrorMessage("");
    
    // Optional: Fetch available times for this date
    // fetchAvailableTimes(dateStr);
  };

  // Validate the selected time
  const validateTime = (timeStr) => {
    if (!timeStr) return "Please select a time";
    
    // Convert time string to minutes for easier comparison
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // Define business hours in minutes
    const morningStart = 7 * 60 + 30;  // 7:30 AM
    const lunchStart = 12 * 60;        // 12:00 PM
    const lunchEnd = 13 * 60;          // 1:00 PM
    const eveningEnd = 17 * 60;        // 5:00 PM
    
    // Check if time is before business hours
    if (totalMinutes < morningStart) {
      return "Appointments cannot be scheduled before 7:30 AM.";
    }
    
    // Check if time is after business hours
    if (totalMinutes > eveningEnd) {
      return "Appointments cannot be scheduled after 5:00 PM.";
    }
    
    // Check if time is during lunch break
    if (totalMinutes >= lunchStart && totalMinutes < lunchEnd) {
      return "Appointments cannot be scheduled during lunch break (12:00 PM - 1:00 PM).";
    }
    
    return null; // No validation errors
  };

  // Handle time change with validation
  const handleTimeChange = (e) => {
    const timeStr = e.target.value;
    const validationError = validateTime(timeStr);
    
    if (validationError) {
      setErrorMessage(validationError);
      setAppointmentTime(timeStr); // Still update the time even if invalid
      return;
    }
    
    setAppointmentTime(timeStr);
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    // Validate date again before submission
    const dateValidationError = validateDate(appointmentDate);
    if (dateValidationError) {
      setErrorMessage(dateValidationError);
      setLoading(false);
      return;
    }
    
    // Validate time before submission
    const timeValidationError = validateTime(appointmentTime);
    if (timeValidationError) {
      setErrorMessage(timeValidationError);
      setLoading(false);
      return;
    }

    // Validate inputs
    if (!appointmentDate || !appointmentTime || !reason) {
      setErrorMessage("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/student/request-appointment",
        {
          appointmentDate,
          appointmentTime,
          reason,
          counselorId: counselor._id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccessMessage("Appointment request submitted successfully! Check your My Appointments to see for Approval ");
      setAppointmentDate("");
      setAppointmentTime("");
      setReason("");
    } catch (error) {
      console.error("Error requesting appointment:", error);
      setErrorMessage("Failed to submit appointment request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  
  // Get max date (30 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  // Add new state to track form validity
  const [formIsValid, setFormIsValid] = useState(false);
  
  // Check form validity whenever relevant fields change
  useEffect(() => {
    // Check if all fields are filled and valid
    const isDateValid = appointmentDate && !validateDate(appointmentDate);
    const isTimeValid = appointmentTime && !validateTime(appointmentTime);
    const isReasonValid = reason && reason.trim().length > 0;
    
    // Update form validity state
    setFormIsValid(isDateValid && isTimeValid && isReasonValid);
  }, [appointmentDate, appointmentTime, reason]);

  return (
    <div className="container mt-4">
      <h2>Request an Appointment</h2>
      
      {/* Success message */}
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      
      {/* Single error message - use warning style for no counselor message */}
      {errorMessage && (
        <div className={`alert ${errorMessage === "No counselor assigned to your course/year" ? "alert-warning" : "alert-danger"}`}>
          {errorMessage}
        </div>
      )}
      
      {/* Only show counselor card when we have a counselor */}
      {counselor && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Your Assigned Counselor</h5>
            <p className="card-text">
              <strong>Name:</strong> {counselor.firstname} {counselor.lastname}<br />
              <strong>Email:</strong> {counselor.email}
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Appointment Details</h5>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="appointmentDate" className="form-label">Preferred Date</label>
              <input
                type="date"
                className="form-control"
                id="appointmentDate"
                value={appointmentDate}
                onChange={handleDateChange}
                min={minDate}
                max={maxDateStr}
                required
              />
              <div className="form-text">
                Select a weekday within the next 30 days. Weekends and holidays are not available.
              </div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="appointmentTime" className="form-label">Preferred Time</label>
              <input
                type="time"
                className="form-control"
                id="appointmentTime"
                value={appointmentTime}
                onChange={handleTimeChange}
                min="07:30"
                max="17:00"
                required
              />
              <div className="form-text">
                Please select a time during office hours (7:30 AM - 5:00 PM). Lunch break (12:00 PM - 1:00 PM) is not available.
              </div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="reason" className="form-label">Reason for Appointment</label>
              <textarea
                className="form-control"
                id="reason"
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="Please briefly describe the reason for your appointment"
              ></textarea>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !counselor || !formIsValid}
            >
              {loading ? "Submitting..." : "Request Appointment"}
            </button>
            
            {!formIsValid && appointmentDate && appointmentTime && reason && (
              <div className="form-text text-danger mt-2">
                Please fix the validation errors before submitting.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default RequestAppointment;