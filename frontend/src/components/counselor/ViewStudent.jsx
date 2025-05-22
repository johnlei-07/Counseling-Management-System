import { useNavigate, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "axios";

function ViewStudent() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [hedSearchTerm, setHedSearchTerm] = useState("");
  const [bedSearchTerm, setBedSearchTerm] = useState("");
  // Add state to track sent students
  const [sentStudentIds, setSentStudentIds] = useState(() => {
    const saved = localStorage.getItem('sentStudentIds');
    return saved ? JSON.parse(saved) : [];
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchStudents();
  }, [location]);

  const fetchStudents = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("http://localhost:5000/counselor/students", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Filter out students that have been sent to admin
      const filteredStudents = response.data.students.filter(
        student => !sentStudentIds.includes(student._id)
      );
      setStudents(filteredStudents);
    } catch (err) {
      // handle error
    }
  };

  // Separate students by level - no filtering by processedStudentIds
  const hedStudents = students.filter(s => s.level === "HED");
  const bedStudents = students.filter(s => s.level === "BED");

  // Filter students based on search terms
  const filteredHedStudents = hedStudents.filter(student => 
    student.firstname.toLowerCase().includes(hedSearchTerm.toLowerCase()) ||
    student.lastname.toLowerCase().includes(hedSearchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(hedSearchTerm.toLowerCase()) ||
    (student.course && student.course.toLowerCase().includes(hedSearchTerm.toLowerCase()))
  );

  const filteredBedStudents = bedStudents.filter(student => 
    student.firstname.toLowerCase().includes(bedSearchTerm.toLowerCase()) ||
    student.lastname.toLowerCase().includes(bedSearchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(bedSearchTerm.toLowerCase()) ||
    (student.year && student.year.toLowerCase().includes(bedSearchTerm.toLowerCase())) ||
    (student.section && student.section.toLowerCase().includes(bedSearchTerm.toLowerCase()))
  );


  return (
    <div className="container mt-5">
      <h3>HED Students</h3>
      {message && (
        <div className="alert alert-success" role="alert">
          {message}
        </div>
      )}
      
      {/* Remove the CSS animation styles */}
      
      {/* Search bar for HED students */}
      <div className="mb-3 ">
        <div className="input-group w-25">
          <span className="input-group-text bg-success text-white">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control border border-success"
            placeholder="Search HED students"
            value={hedSearchTerm}
            onChange={(e) => setHedSearchTerm(e.target.value)}
          />
          {hedSearchTerm && (
            <button 
              className="btn btn-outline-secondary" 
              type="button"
              onClick={() => setHedSearchTerm("")}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      <table className="table table-striped table-bordered">
        <thead className="table-success">
          <tr>
            <th>Email</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Course</th>
            <th>Status</th> 
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredHedStudents.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center">
                {hedStudents.length === 0 ? "No HED students found." : "No matching HED students found."}
              </td>
            </tr>
          ) : (
            filteredHedStudents.map((s) => (
              <tr key={s._id}>
                <td>{s.email}</td>
                <td>{s.firstname}</td>
                <td>{s.lastname}</td>
                <td>{s.course}</td>
                <td>
                  {s.counselingDone ? (
                    <span className="badge bg-success">Done</span>
                  ) : (
                    <span className="badge bg-warning">Pending</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-info me-2"
                    onClick={() => {
                      setSelectedStudent(s);
                      setShowModal(true);
                    }}
                  >
                    View
                  </button>
                  {/* <button
                    className="btn btn-danger"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this student?")) {
                        const token = localStorage.getItem("token");
                        try {
                          await axios.delete(`http://localhost:5000/counselor/student/${s._id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          setMessage("Successfully Deleted");
                          setTimeout(() => {
                            setMessage("");
                            fetchStudents();
                          }, 2000);
                        } catch (err) {
                          alert("Failed to delete student.");
                        }
                      }
                    }}
                  >
                    Delete
                  </button> */}
                </td>

              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Apply the same changes to the BED students table */}
      <h3>BED Students</h3>
      
      {/* Search bar for BED students */}
      <div className="mb-3">
        <div className="input-group w-25">
          <span className="input-group-text bg-success text-white">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control border border-success"
            placeholder="Search BED students by name, email, year, or section..."
            value={bedSearchTerm}
            onChange={(e) => setBedSearchTerm(e.target.value)}
          />
          {bedSearchTerm && (
            <button 
              className="btn btn-outline-secondary" 
              type="button"
              onClick={() => setBedSearchTerm("")}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      <table className="table table-bordered">{/* Remove table-striped */}
        <thead className="table-success">
          <tr>
            <th>Email</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Year</th>
            <th>Section</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBedStudents.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center">
                {bedStudents.length === 0 ? "No BED students found." : "No matching BED students found."}
              </td>
            </tr>
          ) : (
            filteredBedStudents.map((s) => (
              <tr key={s._id}>
                <td>{s.email}</td>
                <td>{s.firstname}</td>
                <td>{s.lastname}</td>
                <td>{s.year}</td>
                <td>{s.section}</td>
                <td>
                  {s.counselingDone ? (
                    <span className="badge bg-success">Done</span>
                  ) : (
                    <span className="badge bg-warning">Pending</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-info me-2"
                    onClick={() => {
                      setSelectedStudent(s);
                      setShowModal(true);
                    }}
                  >
                    View
                  </button>
                  {/* <button
                    className="btn btn-danger"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this student?")) {
                        const token = localStorage.getItem("token");
                        try {
                          await axios.delete(`http://localhost:5000/counselor/student/${s._id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          setMessage("Successfully Deleted");
                          setTimeout(() => {
                            setMessage("");
                            fetchStudents();
                          }, 2000);
                        } catch (err) {
                          alert("Failed to delete student.");
                        }
                      }
                    }}
                  >
                    Delete
                  </button> */}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal for viewing student details */}
      {showModal && selectedStudent && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Student Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">
                        Student No: {selectedStudent.student_no}
                    </h5>
                    <div className="row mb-3">
                      <div className="col-md-5">
                        <p className="card-text"> <strong>Name: </strong>{selectedStudent.lastname} {selectedStudent.firstname}</p>
                      </div>
                      <div className="col-md-3"> 
                        <p className="card-text"><strong>Gender:</strong> {selectedStudent.gender || "N/A"}</p>
                      </div>
                      <div className="col-md-3"> 
                        <p className="card-text"><strong>Date of Birth:</strong> {selectedStudent.dob || "N/A"}</p>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-5">
                        <p className="card-text"><strong>Email:</strong> {selectedStudent.email}</p>
                      </div>
                      <div className="col-md-3"> 
                        <p className="card-text"><strong>Address:</strong> {selectedStudent.address || "N/A"}</p>
                      </div>
                      <div className="col-md-3"> 
                        <p className="card-text"><strong>Phone No:</strong> {selectedStudent.phone_no || "N/A"}</p>
                      </div>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-5"> 
                        <p className="card-text"><strong>Level:</strong> {selectedStudent.level || "N/A"}</p>
                      </div>

                      {selectedStudent.level === "HED" && (
                        <div className="col-md-4">
                          <p className="card-text"><strong>Course:</strong> {selectedStudent.course || "N/A"}</p>
                        </div>
                      )}

                      {selectedStudent.level === "BED" && (
                        <>
                          <div className="col-md-3">
                            <p className="card-text"><strong>Year:</strong> {selectedStudent.year || "N/A"}</p>
                          </div>
                          <div className="col-md-2">
                            <p className="card-text"><strong>Section:</strong> {selectedStudent.section || "N/A"}</p>
                          </div>
                        </>
                      )}
                    </div>
                   
                    
                    <p className="card-text"><strong>Created At:</strong> {selectedStudent.created_at}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowModal(false);
                    navigate(`/counselor/students/update/${selectedStudent._id}`);
                  }}
                >
                  Update
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowModal(false);
                    navigate(`/counselor/students/${selectedStudent._id}/remarks`);
                  }}
                >
                  Remark(s)
                </button>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewStudent;

