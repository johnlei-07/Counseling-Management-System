import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function StudentList() {
  const [students, setStudents] = useState([]);
  const [level, setLevel] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // Add this new state
  const [newRemark, setNewRemark] = useState("");
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [addingRemark, setAddingRemark] = useState(false);
  // Add these new state variables
  const [editingRemarkIndex, setEditingRemarkIndex] = useState(-1);
  const [editRemarkText, setEditRemarkText] = useState("");
  const [updatingRemark, setUpdatingRemark] = useState(false);
  // Add search state
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    fetchCounselors();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/admin/students?counselingDone=true",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStudents(response.data.students || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError(error.response?.data?.message || "Failed to load students. Please try again later.");
      setLoading(false);
      setStudents([]);
    }
  };

  const fetchCounselors = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/admin/counselors",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCounselors(response.data.counselors || []);
    } catch (error) {
      console.error("Error fetching counselors:", error);
    }
  };

  // Filter students based on selection and search term
  const filtered = students.filter(s => {
    // First apply level, course, and year filters
    if (level && s.level !== level) return false;
    if (level === "HED" && course && s.course !== course) return false;
    if (level === "BED" && year && String(s.year) !== String(year)) return false;
    
    // Then apply search term filter if there is one
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        s.email.toLowerCase().includes(searchLower) ||
        s.firstname.toLowerCase().includes(searchLower) ||
        s.lastname.toLowerCase().includes(searchLower) ||
        (s.course && s.course.toLowerCase().includes(searchLower)) ||
        (s.section && s.section.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const handleLevelChange = (e) => {
    setLevel(e.target.value);
    setCourse("");
    setYear("");
  };

  const handleViewRemarks = (studentId) => {
    const student = students.find(s => s._id === studentId);
    if (student) {
      setSelectedStudent(student);
      setShowRemarksModal(true);
    } else {
      setError("Student not found. Please refresh the page and try again.");
    }
  };

  const closeRemarksModal = () => {
    setShowRemarksModal(false);
    setSelectedStudent(null);
    setNewRemark("");
    setSelectedCounselor("");
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) {
      return;
    }

    if (!selectedCounselor) {
      setError("Please select a counselor");
      return;
    }

    setAddingRemark(true);
    try {
      const token = localStorage.getItem("token");
      
      // First, let's update the local state optimistically
      const now = new Date();
      const formattedDate = `${now.toLocaleDateString()} and ${now.toLocaleTimeString()}`;
      const selectedCounselorObj = counselors.find(c => c._id === selectedCounselor);
      const counselorName = selectedCounselorObj ? 
        `${selectedCounselorObj.firstname} ${selectedCounselorObj.lastname}` : 
        "Unknown Counselor";
      
      const newRemarkObj = {
        text: newRemark,
        date: formattedDate,
        counselor_name: counselorName,
        counselor: selectedCounselor
      };
      
      // Update the selected student with the new remark
      const updatedStudent = {
        ...selectedStudent,
        remarks: [newRemarkObj, ...(selectedStudent.remarks || [])]
      };
      
      setSelectedStudent(updatedStudent);
      
      // Update the students array
      setStudents(prevStudents => 
        prevStudents.map(s => 
          s._id === updatedStudent._id ? updatedStudent : s
        )
      );
      
      // Try with the admin endpoint instead of counselor endpoint
      await axios.post(
        `http://localhost:5000/admin/students/${selectedStudent._id}/remarks`,
        {
          text: newRemark,
          counselor_id: selectedCounselor
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setNewRemark("");
      setSelectedCounselor("");
      setAddingRemark(false);
    } catch (error) {
      console.error("Error adding remark:", error);
      
      // Even if the API call fails, we'll keep the optimistic update
      // since the UI is working correctly
      setNewRemark("");
      setSelectedCounselor("");
      setAddingRemark(false);
      
      // Show a warning that the remark might not persist after page refresh
      setError("Remark added locally but may not be saved to the server. It will be lost on page refresh.");
      
      // Clear the error message after 5 seconds
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleEditRemark = (index) => {
    if (selectedStudent && selectedStudent.remarks && selectedStudent.remarks[index]) {
      setEditingRemarkIndex(index);
      setEditRemarkText(selectedStudent.remarks[index].text);
    }
  };

  const cancelEditRemark = () => {
    setEditingRemarkIndex(-1);
    setEditRemarkText("");
  };

  const saveEditedRemark = async (index) => {
    if (!editRemarkText.trim()) {
      return;
    }

    setUpdatingRemark(true);
    try {
      const token = localStorage.getItem("token");
      
      // First, let's update the local state optimistically
      const updatedRemarks = [...selectedStudent.remarks];
      updatedRemarks[index] = {
        ...updatedRemarks[index],
        text: editRemarkText,
        date: updatedRemarks[index].date + " (edited)"
      };
      
      // Update the selected student with the edited remark
      const updatedStudent = {
        ...selectedStudent,
        remarks: updatedRemarks
      };
      
      setSelectedStudent(updatedStudent);
      
      // Update the students array
      setStudents(prevStudents => 
        prevStudents.map(s => 
          s._id === updatedStudent._id ? updatedStudent : s
        )
      );
      
      // Make the API call to update the remark
      await axios.put(
        `http://localhost:5000/admin/students/${selectedStudent._id}/remarks/${index}`,
        {
          text: editRemarkText
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setEditingRemarkIndex(-1);
      setEditRemarkText("");
      setUpdatingRemark(false);
    } catch (error) {
      console.error("Error updating remark:", error);
      
      // Even if the API call fails, we'll keep the optimistic update
      setEditingRemarkIndex(-1);
      setEditRemarkText("");
      setUpdatingRemark(false);
      
      // Show a warning that the edit might not persist after page refresh
      setError("Remark edited locally but may not be saved to the server. Changes might be lost on page refresh.");
      
      // Clear the error message after 5 seconds
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleViewStudent = (studentId) => {
    const student = students.find(s => s._id === studentId);
    if (student) {
      setSelectedStudent(student);
      setShowViewModal(true);
    } else {
      setError("Student not found. Please refresh the page and try again.");
    }
  };
  
  const closeViewModal = () => {
    setShowViewModal(false);
    // Don't reset selectedStudent here if you want to keep it for the remarks modal
  };

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);

  // Get current students for pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filtered.slice(indexOfFirstStudent, indexOfLastStudent);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Calculate total pages
  const totalPages = Math.ceil(filtered.length / studentsPerPage);
  
  // Reset to first page when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [level, course, year, searchTerm]);
  
  return (
    <div className="container-fluid">
      <h3>Student List (Counseling Done)</h3>
      
      <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
  {/* Search Input */}
  <div className="input-group w-auto">
    <span className="input-group-text border border-success">
      <i className="bi bi-search text-success"></i>
    </span>
    <input
      type="text"
      className="form-control border border-success"
      placeholder="Search by name, email, course, or section..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    {searchTerm && (
      <button 
        className="btn btn-success" 
        type="button"
        onClick={() => setSearchTerm("")}
      >
        Clear
      </button>
    )}
  </div>

  {/* Level Filter */}
  <div className="w-auto border border-success">
    <select 
      value={level} 
      onChange={handleLevelChange} 
      className="form-select"
    >
      <option value="">All Levels</option>
      <option value="HED">HED</option>
      <option value="BED">BED</option>
    </select>
  </div>

  {/* Course Filter (only for HED) */}
  {level === "HED" && (
    <div className="w-auto border border-success">
      <select 
        value={course} 
        onChange={e => setCourse(e.target.value)} 
        className="form-select"
      >
        <option value="">All Courses</option>
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
  )}

  {/* Year Filter (only for BED) */}
  {level === "BED" && (
    <div className="w-auto">
      <select 
        value={year} 
        onChange={e => setYear(e.target.value)} 
        className="form-select"
      >
        <option value="">All Years</option>
        {[...Array(12)].map((_, i) => (
          <option key={i+1} value={i+1}>{i+1}</option>
        ))}
      </select>
    </div>
  )}
</div>
    
      

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <table className="table table-striped table-bordered">
            <thead className="table-primary">
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Level</th>
                <th>{level === "HED" ? "Course" : level === "BED" ? "Year" : "Course/Year"}</th>
                {level !== "HED" && <th>Section</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.length === 0 ? (
                <tr><td colSpan={level === "HED" ? 7 : 8} className="text-center">No students found.</td></tr>
              ) : (
                currentStudents.map(s => (
                  <tr key={s._id}>
                    <td>{s.email}</td>
                    <td>{s.firstname} {s.lastname}</td>
                    <td>{s.level}</td>
                    <td>{s.level === "HED" ? s.course : s.year}</td>
                    {level !== "HED" && <td>{s.section || "-"}</td>}
                    <td>
                      {s.counselingDone ? (
                        <span className="badge bg-success">Done</span>
                      ) : (
                        <span className="badge bg-warning">Pending</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-info btn-sm mx-1"
                        onClick={() => handleViewStudent(s._id)}
                      >
                        View
                      </button>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleViewRemarks(s._id)}
                      >
                        Remarks
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination */}
          {filtered.length > 0 && (
            <nav aria-label="Student list pagination">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                
                {/* Show page numbers */}
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Show current page, first page, last page, and pages around current page
                  if (
                    pageNumber === 1 || 
                    pageNumber === totalPages || 
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => paginate(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    );
                  } else if (
                    (pageNumber === currentPage - 2 && currentPage > 3) || 
                    (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                  ) {
                    // Show ellipsis for skipped pages
                    return (
                      <li key={pageNumber} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    );
                  }
                  return null;
                })}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
          
          <div className="text-center text-muted mb-3">
            Showing {filtered.length > 0 ? indexOfFirstStudent + 1 : 0} to {Math.min(indexOfLastStudent, filtered.length)} of {filtered.length} students
          </div>
        </>
      )}
      
      {/* Remarks Modal */}
      {showRemarksModal && selectedStudent && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Student Remarks: {selectedStudent.firstname} {selectedStudent.lastname}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeRemarksModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="student-info mb-3">
                  <p><strong>Email:</strong> {selectedStudent.email}</p>
                  <p><strong>Level:</strong> {selectedStudent.level}</p>
                  {selectedStudent.level === "HED" ? (
                    <p><strong>Course:</strong> {selectedStudent.course || "N/A"}</p>
                  ) : (
                    <>
                      <p><strong>Year:</strong> {selectedStudent.year || "N/A"}</p>
                      <p><strong>Section:</strong> {selectedStudent.section || "N/A"}</p>
                    </>
                  )}
                  <p><strong>Counselor:</strong> {selectedStudent.counselor_email || "N/A"}</p>
                </div>
                
                {/* Add New Remark Form */}
                <div className="card mb-4 border border-primary">
                  <div className="card-header bg-primary text-white">
                    Add New Remark
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label htmlFor="counselorSelect" className="form-label">Select Counselor</label>
                      <select 
                        id="counselorSelect"
                        className="form-select"
                        value={selectedCounselor}
                        onChange={(e) => setSelectedCounselor(e.target.value)}
                        disabled={addingRemark}
                      >
                        <option value="" className="">-- Select Counselor --</option>
                        {counselors.map(counselor => (
                          <option  key={counselor._id} value={counselor._id}>
                            {counselor.firstname} {counselor.lastname} ({counselor.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="remarkText" className="form-label">Remark</label>
                      <textarea
                        id="remarkText"
                        className="form-control"
                        rows="3"
                        value={newRemark}
                        onChange={(e) => setNewRemark(e.target.value)}
                        placeholder="Enter remark here..."
                        disabled={addingRemark}
                      ></textarea>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleAddRemark}
                      disabled={!newRemark.trim() || !selectedCounselor || addingRemark}
                    >
                      {addingRemark ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Adding...
                        </>
                      ) : (
                        "Add Remark"
                      )}
                    </button>
                  </div>
                </div>
                
                <h6>Remarks History</h6>
                {selectedStudent.remarks && selectedStudent.remarks.length > 0 ? (
                  <ul className="list-group ">
                    {selectedStudent.remarks.map((remark, index) => (
                      <li key={index} className="list-group-item border border-dark">
                        {editingRemarkIndex === index ? (
                          <div>
                            <textarea 
                              className="form-control " 
                              rows="3" 
                              value={editRemarkText}
                              onChange={e => setEditRemarkText(e.target.value)}
                            ></textarea>
                            <div className="d-flex justify-content-end">
                              <button 
                                className="btn btn-sm btn-secondary me-2" 
                                onClick={cancelEditRemark}
                                disabled={updatingRemark}
                              >
                                Cancel
                              </button>
                              <button 
                                className="btn btn-sm btn-success" 
                                onClick={() => saveEditedRemark(index)}
                                disabled={updatingRemark}
                              >
                                {updatingRemark ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="remark-text">{remark.text}</div>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                              <small className="text-muted">
                                <strong>Date:</strong> {remark.date} | 
                                <strong> Counselor:</strong> {remark.counselor_name || remark.counselor}
                              </small>
                              <button 
                                className="btn btn-sm btn-outline-primary" 
                                onClick={() => handleEditRemark(index)}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No remarks available for this student.</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeRemarksModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Student View Modal */}
      {showViewModal && selectedStudent && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Student Details: {selectedStudent.firstname} {selectedStudent.lastname}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeViewModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Email:</strong> {selectedStudent.email}</p>
                    <p><strong>Level:</strong> {selectedStudent.level}</p>
                    {selectedStudent.level === "HED" ? (
                      <p><strong>Course:</strong> {selectedStudent.course || "N/A"}</p>
                    ) : (
                      <>
                        <p><strong>Year:</strong> {selectedStudent.year || "N/A"}</p>
                        <p><strong>Section:</strong> {selectedStudent.section || "N/A"}</p>
                      </>
                    )}
                    <p><strong>Counselor:</strong> {selectedStudent.counselor_email || "N/A"}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Gender:</strong> {selectedStudent.gender || "N/A"}</p>
                    <p><strong>Phone:</strong> {selectedStudent.phone_no || "N/A"}</p>
                    <p><strong>Address:</strong> {selectedStudent.address || "N/A"}</p>
                    <p><strong>Date of Birth:</strong> {selectedStudent.dob || "N/A"}</p>
                  </div>
                </div>
                
                {/* Display remarks summary if available */}
                {selectedStudent.remarks && selectedStudent.remarks.length > 0 && (
                  <div className="mt-4">
                    <h6>Counseling Summary:</h6>
                    <p>{selectedStudent.remarks.length} counseling session(s) recorded</p>
                    <p><strong>Latest session:</strong> {selectedStudent.remarks[0].date.split(" and ")[0]}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeViewModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentList;







