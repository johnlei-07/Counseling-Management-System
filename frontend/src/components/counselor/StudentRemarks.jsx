import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

function StudentRemarks() {
  const { studentId } = useParams();
  const [remarks, setRemarks] = useState([]);
  const [newRemark, setNewRemark] = useState("");
  const [markAsDone, setMarkAsDone] = useState(false);
  const [student, setStudent] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`http://localhost:5000/counselor/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudent(res.data.student);
      setRemarks(res.data.student.remarks || []);
    } catch (err) {
      // handle error
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    
    // Validation: Check if there's no text and checkbox is not checked
    if (!newRemark.trim() && !markAsDone) {
      setSuccessMessage("Please add a remark or check 'Mark counseling as done'");
      setTimeout(() => setSuccessMessage(""), 3000);
      return;
    }
    
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `http://localhost:5000/counselor/student/${studentId}/remarks`,
        { 
          remark: newRemark,
          markAsDone: markAsDone 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewRemark("");
      setMarkAsDone(false);
      
      // Show success message
      setSuccessMessage("Remark added successfully!");
      
      // Refresh the student data to show the new remark
      fetchStudent();
      
      // Stay on the current page instead of navigating away
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      setSuccessMessage("Failed to add remark. Please try again.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleEditClick = (idx) => {
    setEditingIdx(idx);
    setEditingText(remarks[idx].text);
    setShowModal(true);
  };

  const handleCancelEdit = () => {
    setEditingIdx(null);
    setEditingText("");
    setShowModal(false);
  };

  const handleSaveEdit = async (idx) => {
    if (!window.confirm("Are you sure you want to save?")) {
      return;
    }
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `http://localhost:5000/counselor/student/${studentId}/remarks/${idx}`,
        { text: editingText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingIdx(null);
      setEditingText("");
      setShowModal(false);
      fetchStudent();
    } catch (err) {
      // handle error
    }
  };

  return (
    <div className="container mt-5">
      <h3>Student Remarks</h3>
      {student && (
        <div className="mb-3">
          <strong>{student.lastname}, {student.firstname}</strong> ({student.level})
        </div>
      )}
      
      {/* Success message */}
      {successMessage && (
        <div className={`alert ${successMessage.includes("Failed") || successMessage.includes("Please add") ? "alert-danger" : "alert-success"} mb-3`}>
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleAddRemark} className="mb-3">
        <textarea
          className="form-control mb-2"
          value={newRemark}
          onChange={(e) => setNewRemark(e.target.value)}
          placeholder="Add a new remark"
        />
        <div className="form-check mb-2">
        </div>
        <button type="submit" className="btn btn-primary">Add Remark</button>
      </form>
      <h5>Previous Remarks</h5>
      {remarks.length === 0 ? (
        <div>No remarks yet.</div>
      ) : (
        <ul className="list-group">
          {remarks.map((r, idx) => (
            <li key={idx} className="list-group-item">
              <div>{r.text}</div>
              <small className="text-muted">
                {r.date}
                {r.counselor_name && (
                  <>
                    {" | "}
                    <span>
                      Counselor: {r.counselor_name}
                    </span>
                  </>
                )}
                {!r.counselor_name && r.counselor && (
                  <>
                    {" | "}
                    <span>
                      Counselor: {r.counselor}
                    </span>
                  </>
                )}
              </small>
              <button
                className="btn btn-link btn-sm ms-2"
                onClick={() => handleEditClick(idx)}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Modal for editing remark */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Remark</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={handleCancelEdit}></button>
              </div>
              <div className="modal-body">
                <textarea
                  className="form-control"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-success"
                  onClick={() => handleSaveEdit(editingIdx)}
                >
                  Save
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add a back button */}
      <div className="mt-3">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate("/counselor/students")}
        >
          Back to Students
        </button>
      </div>
    </div>
  );
}

export default StudentRemarks;

// In your form or button section, keep only the "Add Remark" button
// and remove any "Send to Admin" or similar buttons



// Remove any "Send to Admin" button that might look like:
// <button type="button" className="btn btn-success" onClick={handleSendToAdmin}>
//   Send to Admin
// </button>