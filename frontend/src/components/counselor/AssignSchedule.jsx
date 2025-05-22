import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AssignSchedule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Student selection states
  const [selectionType, setSelectionType] = useState("course"); // "course" for HED, "year" for BED
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  
  // Add search term state
  const [searchTerm, setSearchTerm] = useState("");
  
  // Schedule details
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleReason, setScheduleReason] = useState("Regular Counseling Session");
  
  // Fetch students based on selection criteria
  const fetchStudentsByFilter = async () => {
    setIsFetchingStudents(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      let url = "http://localhost:5000/counselor/students?";
      
      if (selectionType === "course") {
        url += `level=HED&course=${selectedCourse}`;
      } else {
        url += `level=BED&year=${selectedYear}${selectedSection ? `&section=${selectedSection}` : ''}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStudents(response.data.students || []);
      // Auto-select all students
      setSelectedStudents(response.data.students.map(student => student._id));
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to load students. Please try again.");
    } finally {
      setIsFetchingStudents(false);
    }
  };

  // Handle sending bulk schedule
  const handleSendBulkSchedule = async () => {
    if (!scheduleDate || !scheduleTime || !scheduleReason || selectedStudents.length === 0) {
      setError("Please fill all fields and select at least one student");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/counselor/bulk-schedule",
        {
          studentIds: selectedStudents,
          appointmentDate: scheduleDate,
          appointmentTime: scheduleTime,
          reason: scheduleReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage(`Counseling schedule sent to ${selectedStudents.length} students successfully!`);
      
      // Reset form
      setScheduleDate("");
      setScheduleTime("");
      setScheduleReason("Regular Counseling Session");
      setSelectedStudents([]);
      setStudents([]);
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error sending bulk schedule:", error);
      setError("Failed to send counseling schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Toggle all students
  const toggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(student => student._id));
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      student.email.toLowerCase().includes(searchLower) ||
      student.firstname.toLowerCase().includes(searchLower) ||
      student.lastname.toLowerCase().includes(searchLower) ||
      (student.course && student.course.toLowerCase().includes(searchLower)) ||
      (student.section && student.section.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="container mt-4">
      <h2>Assign Counseling Schedule</h2>
      
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <div className="card mb-4">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">Select Students</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Student Selection Type</label>
              <div className="form-check">
                <input 
                  className="form-check-input" 
                  type="radio" 
                  name="selectionType" 
                  id="courseSelection" 
                  value="course"
                  checked={selectionType === "course"}
                  onChange={() => setSelectionType("course")}
                />
                <label className="form-check-label" htmlFor="courseSelection">
                  By Course (HED)
                </label>
              </div>
              <div className="form-check">
                <input 
                  className="form-check-input" 
                  type="radio" 
                  name="selectionType" 
                  id="yearSelection" 
                  value="year"
                  checked={selectionType === "year"}
                  onChange={() => setSelectionType("year")}
                />
                <label className="form-check-label" htmlFor="yearSelection">
                  By Year and Section (BED)
                </label>
              </div>
            </div>
            
            <div className="col-md-6">
              {selectionType === "course" ? (
                <div>
                  <label htmlFor="courseSelect" className="form-label">Select Course</label>
                  <select 
                    id="courseSelect" 
                    className="form-select"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <option value="">Select a course</option>
                    <option value="ABComm">ABComm</option>
                    <option value="BEED">BEED</option>
                    <option value="BSA">BSA</option>
                    <option value="BSBA">BSBA</option>
                    <option value="BSCS">BSCS</option>
                    <option value="BSED">BSED</option>
                    <option value="BSMA">BSMA</option>
                    <option value="BSN">BSN</option>
                    <option value="BSP">BSP</option>
                    <option value="BSPHRM">BSPHRM</option>
                    <option value="BSSW">BSSW</option>
                  </select>
                </div>
              ) : (
                <div className="row">
                  <div className="col-md-6">
                    <label htmlFor="yearSelect" className="form-label">Select Year</label>
                    <select 
                      id="yearSelect" 
                      className="form-select"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      <option value="">Select Year</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="sectionInput" className="form-label">Section (Optional)</label>
                    <input 
                      type="text" 
                      id="sectionInput" 
                      className="form-control"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      placeholder="e.g., A"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <button 
                className="btn btn-success" 
                onClick={fetchStudentsByFilter}
                disabled={isFetchingStudents || (selectionType === "course" && !selectedCourse) || (selectionType === "year" && !selectedYear)}
              >
                {isFetchingStudents ? "Loading..." : "Find Students"}
              </button>
            </div>
            
            {/* Add search input */}
            {students.length > 0 && (
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-success text-white">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border border-success"
                    placeholder="Search students by name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Student list */}
          {students.length > 0 && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5>Student List</h5>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="selectAll"
                    checked={selectedStudents.length === students.length}
                    onChange={toggleAllStudents}
                  />
                  <label className="form-check-label" htmlFor="selectAll">
                    Select All
                  </label>
                </div>
              </div>
              
              {filteredStudents.length === 0 ? (
                <div className="alert alert-info">No students match your search criteria.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-bordered">
                    <thead className="table-success">
                      <tr>
                        <th>Select</th>
                        {/* <th>Name</th>
                        <th>Email</th>
                        {selectionType === "course" ? <th>Course</th> : <th>Year & Section</th>} */}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(student => (
                        <div key={student._id} className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id={`student-${student._id}`}
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => toggleStudentSelection(student._id)}
                          />
                          <label className="form-check-label" htmlFor={`student-${student._id}`}>
                            {student.firstname} {student.lastname} 
                            {student.level === "HED" ? ` - ${student.course}` : ` - Year ${student.year}${student.section ? `-${student.section}` : ''}`}
                          </label>
                        </div>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Schedule details card */}
      <div className="card mb-4">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">Schedule Details</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <label htmlFor="scheduleDate" className="form-label">Counseling Date</label>
              <input 
                type="date" 
                id="scheduleDate" 
                className="form-control"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                required
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="scheduleTime" className="form-label">Counseling Time</label>
              <input 
                type="time" 
                id="scheduleTime" 
                className="form-control"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                required
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="scheduleReason" className="form-label">Reason/Topic</label>
              <input 
                type="text" 
                id="scheduleReason" 
                className="form-control"
                value={scheduleReason}
                onChange={(e) => setScheduleReason(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        <div className="card-footer">
          <button 
            className="btn btn-success" 
            onClick={handleSendBulkSchedule}
            disabled={!scheduleDate || !scheduleTime || !scheduleReason || selectedStudents.length === 0 || loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Sending...
              </>
            ) : `Send Schedule to ${selectedStudents.length} Students`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignSchedule;