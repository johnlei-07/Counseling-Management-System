import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function StudentRemarks() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState({});
  const [remarks, setRemarks] = useState([]);
  const [remarkText, setRemarkText] = useState("");
  const [markAsDone, setMarkAsDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchStudentAndRemarks();
  }, [studentId]);

  const fetchStudentAndRemarks = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch student details
      const studentResponse = await axios.get(`http://localhost:5000/counselor/student/${studentId}`, { headers });
      setStudent(studentResponse.data.student);
      
      // Remarks might be included in the student data
      if (studentResponse.data.student.remarks) {
        setRemarks(studentResponse.data.student.remarks);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      setError("Failed to load student information");
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/counselor/student/${studentId}/remark`,
        { remark: remarkText, markAsDone: markAsDone },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setRemarkText("");
      setMarkAsDone(false);
      // Refresh remarks after adding
      fetchStudentAndRemarks();
      setSuccess("Remark added successfully");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error adding remark:", error);
      setError(error.response?.data?.message || "Failed to add remark");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Student Remarks</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      {/* Student Information */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Student Information</h5>
        </div>
        <div className="card-body">
          <p><strong>Name:</strong> {student.firstname} {student.lastname}</p>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Level:</strong> {student.level}</p>
          {student.level === "HED" && <p><strong>Course:</strong> {student.course}</p>}
          {student.level === "BED" && (
            <>
              <p><strong>Year:</strong> {student.year}</p>
              <p><strong>Section:</strong> {student.section}</p>
            </>
          )}
        </div>
      </div>
      
      {/* Add Remark Form */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Add Remark</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleAddRemark}>
            <div className="mb-3">
              <label htmlFor="remarkText" className="form-label">Remark</label>
              <textarea
                id="remarkText"
                className="form-control"
                rows="3"
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="markAsDone"
                checked={markAsDone}
                onChange={(e) => setMarkAsDone(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="markAsDone">Mark counseling as done</label>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Remark"}
            </button>
          </form>
        </div>
      </div>
      
      {/* Remarks History */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Remarks History</h5>
        </div>
        <div className="card-body">
          {remarks && remarks.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Remark</th>
                    <th>Counselor</th>
                  </tr>
                </thead>
                <tbody>
                  {remarks.map((remark, index) => (
                    <tr key={index}>
                      <td>{remark.date}</td>
                      <td>{remark.text}</td>
                      <td>{remark.counselor_name || remark.counselor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center">No remarks available for this student.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentRemarks;