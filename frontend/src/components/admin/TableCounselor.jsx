import React, { useEffect, useState } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import './admin.css'


function TableCounselor() {
  const [counselors, setCounselors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  // New state variables for assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentType, setAssignmentType] = useState("course");
  const [assignmentValue, setAssignmentValue] = useState("");

  useEffect(() => {
    fetchCounselors();
  }, []);

  const fetchCounselors = async () => {

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/admin/counselors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCounselors(response.data.counselors);
    } catch (err) {
      setErrorMessage("Failed to fetch counselors.");
    }
  };

  const deleteCounselor = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this counselor?");
    if (confirmDelete) {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.delete(`http://localhost:5000/admin/delete/counselor/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 200) {
          await fetchCounselors();
          setSuccessMessage("Counselor deleted successfully!");
          setTimeout(() => setSuccessMessage(""), 3000);
        }
      } catch (err) {
        setErrorMessage("Failed to delete counselor.");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    }
  };

  const handleUpdateCounselor = async () => {
    const confirmUpdate = window.confirm("Are you sure you want to change?");
    if (!confirmUpdate) return;
  
    const token = localStorage.getItem("token");
  
    try {
      const response = await axios.put(
        `http://localhost:5000/admin/update/counselor/${selectedCounselor._id}`,
        {
          firstname: selectedCounselor.firstname,
          lastname: selectedCounselor.lastname,
          email: selectedCounselor.email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.status === 200) {
        setShowModal(false);
        fetchCounselors();
        setSuccessMessage("Counselor updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      setErrorMessage("Update failed.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };
  // Add this function to handle assignment submission
  const handleAssignSubmit = async () => {
    if (!assignmentValue) {
      setErrorMessage("Please enter a value for the assignment");
      return;
    }
  
    // First check if this assignment already exists for the current counselor
    const isDuplicate = assignments.some(
      assignment => 
        assignment.type === assignmentType && 
        assignment.value === assignmentValue
    );
    
    if (isDuplicate) {
      setErrorMessage(`This ${assignmentType === 'course' ? 'course' : 'year'} is already assigned to this counselor!`);
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }
    
    // Check if this assignment already exists for another counselor
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/admin/counselors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const allCounselors = response.data.counselors;
      
      // Check if any other counselor already has this assignment
      const isAssigned = allCounselors.some(counselor => {
        // Skip the current counselor
        if (counselor._id === selectedCounselor._id) {
          return false;
        }
        
        // Check if this counselor has the assignment
        return (counselor.assignments || []).some(
          assignment => 
            assignment.type === assignmentType && 
            assignment.value === assignmentValue
        );
      });
      
      if (isAssigned) {
        // Change from alert to error message
        setErrorMessage(`This ${assignmentType === 'course' ? 'course' : 'year'} is already assigned to another counselor!`);
        setTimeout(() => setErrorMessage(""), 4000);
        return;
      }
      
      // Add the new assignment
      const newAssignment = {
        type: assignmentType,
        value: assignmentValue
      };
    
      const updatedAssignments = [...assignments, newAssignment];
      setAssignments(updatedAssignments);
      setAssignmentValue("");
      
      // Add alert to remind user to save assignments
      alert("Assignment added! Don't forget to click 'Save Assignments' to finalize your changes.");
      
    } catch (err) {
      setErrorMessage("Failed to check assignment availability.");
      console.error(err);
    }
  };

  // Add this function to remove an assignment
  // Modify this function to add confirmation alerts
  // Modify the removeAssignment function to track that a removal occurred
  const removeAssignment = (index) => {
  // First confirmation
  if (window.confirm("Are you sure you want to Remove?")) {
    const updatedAssignments = [...assignments];
    updatedAssignments.splice(index, 1);
    setAssignments(updatedAssignments);
    
    // Success message after removal
    alert("Don't forget to click 'Save Assignments' to finalize your changes.");
  }
};

  // Add this function to save assignments to the server
  const saveAssignments = async () => {
  // Check if assignments array is empty
  if (assignments.length === 0) {
    alert("Failed to assign! Click Add button first before Save Assignments.");
    return;
  }

  // Check if the assignments have changed from the original
  const originalAssignments = selectedCounselor.assignments || [];
  
  // Check if assignments were removed
  const wereAssignmentsRemoved = originalAssignments.length > assignments.length;
  
  const hasNewAssignments = assignments.length !== originalAssignments.length || 
    assignments.some((newAssign, index) => {
      if (index >= originalAssignments.length) return true;
      return newAssign.type !== originalAssignments[index].type || 
             newAssign.value !== originalAssignments[index].value;
    });

  if (!hasNewAssignments) {
    alert("Failed to assign! Click Add button first before Save Assignments.");
    return;
  }

  const token = localStorage.getItem("token");
  try {
    const response = await axios.put(
      `http://localhost:5000/admin/counselor/${selectedCounselor._id}/assign`,
      { assignments },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      // Close modal first
      setShowAssignModal(false);
      
      // Then fetch data without clearing messages
      await fetchCounselors();
      
      // Set appropriate success message based on whether assignments were removed
      if (wereAssignmentsRemoved) {
        setSuccessMessage("Successfully Removed Assignments!");
      } else {
        setSuccessMessage("Successfully Saved Assignments!");
      }
      
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  } catch (err) {
    setErrorMessage("Failed to update assignments.");
    setTimeout(() => setErrorMessage(""), 3000);
  }
};

  // Add this function to load existing assignments when opening the modal
  const openAssignModal = (counselor) => {
    setSelectedCounselor(counselor);
    setAssignments(counselor.assignments || []);
    setShowAssignModal(true);
  };

  return (
    <div className="container mt-5">
      <h3>Counselors</h3>

      {successMessage && (
        <div className="alert alert-success" role="alert">
          <strong>{successMessage}</strong>
        </div>
      )}
      
      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <table className="table table-striped table-bordered border-success ">
        <thead className="table-success">
          <tr>
            <th>Email</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {counselors.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">No counselors found.</td>
            </tr>
          ) : (
            counselors.map((c) => (
              <tr key={c._id}>
                <td>{c.email}</td>
                <td>{c.firstname}</td>
                <td>{c.lastname}</td>
                <td>{c.created_at}</td>
                <td>
                  <button
                    className="btn btn-danger me-2"
                    onClick={() => deleteCounselor(c._id)}
                  >
                    Delete
                  </button>
                  <button
                    className="btn btn-primary me-2"
                    onClick={() => {
                      setSelectedCounselor(c);
                      setShowModal(true);
                    }}
                  >
                    Update
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => openAssignModal(c)}
                  >
                    Assign
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Existing Update Modal */}
      {showModal && selectedCounselor && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Counselor</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="form-group mb-2">
                  <label>First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedCounselor.firstname}
                    onChange={(e) =>
                      setSelectedCounselor({
                        ...selectedCounselor,
                        firstname: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group mb-2">
                  <label>Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedCounselor.lastname}
                    onChange={(e) =>
                      setSelectedCounselor({
                        ...selectedCounselor,
                        lastname: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group mb-2">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={selectedCounselor.email}
                    onChange={(e) =>
                      setSelectedCounselor({
                        ...selectedCounselor,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateCounselor}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Assignment Modal */}
      {showAssignModal && selectedCounselor && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Assign Courses/Years to {selectedCounselor.firstname} {selectedCounselor.lastname}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAssignModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {errorMessage && (
                  <div className="alert alert-danger mb-3">
                    {errorMessage}
                  </div>
                )}
                
                <div className="row mb-3">
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={assignmentType}
                      onChange={(e) => setAssignmentType(e.target.value)}
                    >
                      <option value="course">Course (HED)</option>
                      <option value="year">Year (BED)</option>
                    </select>
                  </div>
                  <div className="col-md-5">
                    {assignmentType === "course" ? (
                      <select
                        className="form-select"
                        value={assignmentValue}
                        onChange={(e) => setAssignmentValue(e.target.value)}
                      >
                        <option value="">Select a course...</option>
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
                    ) : (
                      <select
                        type="text"
                        className="form-select"
                        value={assignmentValue}
                        onChange={(e) => setAssignmentValue(e.target.value)}
                      >
                        <option value="">Select a year...</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                        <option value="11">11</option>
                        <option value="12">12</option>
                      </select>
                    )}
                  </div>
                  <div className="col-md-3">
                    <button
                      className="btn btn-primary w-100"
                      onClick={handleAssignSubmit}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <h6>Current Assignments:</h6>
                {assignments.length === 0 ? (
                  <p>No assignments yet.</p>
                ) : (
                  <>
                    {/* HED Courses Table */}
                    <h6 className="mt-3">Higher Education (HED) Courses:</h6>
                    {assignments.filter(a => a.type === "course").length === 0 ? (
                      <p>No HED courses assigned.</p>
                    ) : (
                      <table className="table table-bordered mb-4">
                        <thead className="table-primary">
                          <tr>
                            <th>Course</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments
                            .filter(assignment => assignment.type === "course")
                            .map((assignment, index) => {
                              const originalIndex = assignments.findIndex(a => 
                                a.type === assignment.type && a.value === assignment.value
                              );
                              return (
                                <tr key={originalIndex}>
                                  <td>{assignment.value}</td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => removeAssignment(originalIndex)}
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    )}

                    {/* BED Years Table */}
                    <h6 className="mt-3">Basic Education (BED) Years:</h6>
                    {assignments.filter(a => a.type === "year").length === 0 ? (
                      <p>No BED years assigned.</p>
                    ) : (
                      <table className="table table-bordered">
                        <thead className="table-success">
                          <tr>
                            <th className="w-50">Year</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments
                            .filter(assignment => assignment.type === "year")
                            .map((assignment, index) => {
                              const originalIndex = assignments.findIndex(a => 
                                a.type === assignment.type && a.value === assignment.value
                              );
                              return (
                                <tr key={originalIndex}>
                                  <td>{assignment.value}</td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => removeAssignment(originalIndex)}
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={saveAssignments}
                >
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableCounselor;
