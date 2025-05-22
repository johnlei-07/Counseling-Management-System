import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function UpdateStudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/counselor/student/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudent(response.data.student);
    };
    fetchStudent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing level from BED to HED, clear year and section
    if (name === 'level' && student.level === 'BED' && value === 'HED') {
      setStudent({
        ...student,
        [name]: value,
        year: '',
        section: ''
      });
    } else {
      setStudent({ ...student, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      // Prepare payload based on student.level
      let payload = {
        firstname: student.firstname,
        lastname: student.lastname,
        email: student.email,
        gender: student.gender,
        phone_no: student.phone_no,
        address: student.address,
        dob: student.dob,
        level: student.level, // Include level in the payload
      };
      
      if (student.level === "HED") {
        payload.course = student.course;
      } else if (student.level === "BED") {
        payload.year = student.year;
        payload.section = student.section;
      }
      
      await axios.put(
        `http://localhost:5000/counselor/student/${id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("Successfully updated!");
      setTimeout(() => {
        setMessage("");
        navigate("/counselor/students");
      }, 2000);
    } catch (error) {
      setMessage("Failed to update!");
    }
  };

  if (!student) return <div>Loading...</div>;

  return (
    <div className="container mt-5">
      <h3>Update Student</h3>
      {message && (
        <div className={`alert ${message.includes("Success") ? "alert-success" : "alert-danger"}`} role="alert">
          {message}
        </div>
      )}
      <div className="card shadow p-3">
      <form onSubmit={handleSubmit}>
        <div className="row mb-3">
          <div className="col-md-6">
            <label htmlFor="firstname" className="form-label  ">Firstname</label>
            <input 
            type="text" 
            name="firstname" 
            className="form-control mb-2" 
            value={student.firstname} 
            onChange={handleChange} 
            placeholder="First Name" />
          </div>
          <div className="col-md-6">
            <label htmlFor="lastname" className="form-label">Lastname</label>
            <input 
            type="text" 
            name="lastname" 
            className="form-control mb-2"
             value={student.lastname} 
             onChange={handleChange} 
             placeholder="Last Name" />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-4">
            <label htmlFor="email" className="form-label">Email</label>
           <input 
           type="email" 
           name="email" 
           className="form-control mb-2" 
           value={student.email} 
           onChange={handleChange} 
           placeholder="Email" />
          </div>

          <div className="col-md-4">
            <label htmlFor="gender" className="form-label">Gender</label>
            <select 
            type="text" 
            name="gender" 
            className="form-control mb-2" 
            value={student.gender || ""}
            onChange={handleChange} 
            placeholder="Gender">
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            </select>
          </div>

          <div className="col-md-4">
            <label htmlFor="phone_no" className="form-label">Phone No.</label>
            <input 
            type="text" 
            name="phone_no" 
            className="form-control mb-2" 
            value={student.phone_no || ""} 
            onChange={handleChange} 
            placeholder="Phone No" />
          </div>

        </div>

        <div className="row mb-3">
          <div className="col-md-4">
            <label htmlFor="address" className="form-label">Address</label>
            <input 
            type="text" 
            name="address" 
            className="form-control mb-2" 
            value={student.address || ""} 
            onChange={handleChange} 
            placeholder="Address" />
          </div>
          <div className="col-md-4">
            <label htmlFor="dob" className="form-label">Date of Birth</label>
            <input 
            type="date" 
            name="dob" 
            className="form-control mb-2" 
            value={student.dob || ""} 
            onChange={handleChange} 
            placeholder="Date of Birth" />
          </div>
          <div className="col-md-4">
            <label htmlFor="course" className="form-label">Course</label>
             {/* Only show level selection for BED students */}
        {student.level === "BED" && (
          <select
            name="level"
            className="form-select mb-2"
            value={student.level}
            onChange={handleChange}
            required
          >
            <option value="BED">Basic Education (BED)</option>
            <option value="HED">Higher Education (HED)</option>
          </select>
        )}
        
        {/* Conditionally render course select for HED */}
        {student.level === "HED" && (
          <select
            name="course"
            className="form-select mb-2"
            value={student.course || ""}
            onChange={handleChange}
            required
          >
            <option value="">Select Course</option>
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
        )}
        {student.level === "BED" && (
          <>
            <label htmlFor="year" className="form-label">Year</label>
            <select
              name="year"
              className="form-select mb-2"
              value={student.year || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select Year</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <label htmlFor="section" className="form-label">Section</label>
            <input
              type="text"
              name="section"
              className="form-control mb-2"
              value={student.section || ""}
              onChange={handleChange}
              placeholder="Section"
            />
          </>
        )}
          </div>
        </div>
        
       
        <button type="submit" className="btn btn-success">Save Changes</button>
        <button className="btn btn-secondary mx-1 px-4"  onClick={() => navigate("/counselor/students")}>Back</button>
      </form>
      </div>
      
    </div>
  );
}

export default UpdateStudentForm;