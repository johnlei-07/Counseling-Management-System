import React, { useState, useEffect } from "react";
import axios from "axios";

function StudentDashboard() {
  const [student, setStudent] = useState({});
  const [counselingHistory, setCounselingHistory] = useState([]);
  const [counselingSchedules, setCounselingSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [schedulesLoading, setSchedulesLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`
        };

        // Fetch student profile
        const profileResponse = await axios.get("http://localhost:5000/student/profile", { headers });
        setStudent(profileResponse.data.student);

        // Process counseling history if available
        if (profileResponse.data.student.remarks) {
          // Process dates to remove time
          const processedRemarks = profileResponse.data.student.remarks.map(remark => {
            // If date contains "and" (like "April 23, 2025 and 2:00 PM"), split and take only the date part
            const dateOnly = remark.date.split(" and ")[0];
            return {
              ...remark,
              date: dateOnly
            };
          });
          setCounselingHistory(processedRemarks);
        }
        
        // Fetch counseling schedules
        try {
          setSchedulesLoading(true);
          const schedulesResponse = await axios.get("http://localhost:5000/student/counseling-schedules", { headers });
          setCounselingSchedules(schedulesResponse.data.schedules || []);
        } catch (scheduleError) {
          console.error("Error fetching counseling schedules:", scheduleError);
          setCounselingSchedules([]);
        } finally {
          setSchedulesLoading(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.message === 'Network Error') {
          setError("Cannot connect to server. Please check your connection or try again later.");
        } else {
          setError("An error occurred while loading your data. Please try again.");
        }
        setLoading(false);
      }
    };

    fetchData();
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

  if (loading) {
    return <div className="text-center mt-5"><h3>Loading...</h3></div>;
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
        <button 
          className="btn btn-primary" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Your Profile</h2>
      
      {/* Student Information Card */}
      <div className="card mb-4">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">Student Information</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Name:</strong> {student.firstname} {student.lastname}</p>
              <p><strong>Email:</strong> {student.email}</p>
              {student.level === "HED" && (
                <p><strong>Course:</strong> {student.course || "N/A"}</p>
              )}
              {student.level === "BED" && (
                <>
                  <p><strong>Year:</strong> {student.year || "N/A"}</p>
                  <p><strong>Section:</strong> {student.section || "N/A"}</p>
                </>
              )}
            </div>
            <div className="col-md-6">
              <p><strong>Level:</strong> {student.level || "N/A"}</p>
              <p><strong>Gender:</strong> {student.gender || "Not specified"}</p>
              <p><strong>Phone:</strong> {student.phone_no || "Not specified"}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upcoming Counseling Schedules */}
      <div className="card mb-4">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">Upcoming Counseling Schedules</h5>
        </div>
        <div className="card-body">
          {schedulesLoading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : counselingSchedules.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Counselor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {counselingSchedules.map((schedule, index) => (
                    <tr key={index}>
                      <td>{formatDate(schedule.appointment_date)}</td>
                      <td>{schedule.appointment_time}</td>
                      <td>{schedule.reason}</td>
                      <td>{schedule.counselor_name}</td>
                      <td>
                        <span className={`badge ${
                          schedule.status === 'pending' ? 'bg-warning text-dark' :
                          schedule.status === 'approved' ? 'bg-success' :
                          schedule.status === 'completed' ? 'bg-info' :
                          schedule.status === 'rejected' ? 'bg-danger' :
                          schedule.status === 'failed to attend' ? 'bg-dark' :
                          'bg-secondary'
                        }`}>
                          {schedule.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center">No upcoming counseling schedules.</p>
          )}
        </div>
      </div>
      
      {/* Counseling History */}
      <div className="card">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">Counseling History</h5>
        </div>
        <div className="card-body">
          {counselingHistory && counselingHistory.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Remarks</th>
                    <th>Counselor</th>
                  </tr>
                </thead>
                <tbody>
                  {counselingHistory.map((record, index) => (
                    <tr key={index}>
                      <td>{record.date}</td>
                      <td>{record.text}</td>
                      <td>{record.counselor_name || record.counselor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center">No counseling history available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;