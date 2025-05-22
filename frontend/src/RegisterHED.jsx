import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function RegisterHED() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm_password: "",
    firstname: "",
    lastname: "",
    course: "",
    phone_no: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // In your handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
  
    try {
      // Add console.log to debug the data being sent
      console.log("Sending data:", {
        ...formData,
        level: "HED",
      });
      
      const response = await axios.post("http://localhost:5000/register/student", {
        ...formData,
        level: "HED",
      });
      
      setLoading(false);
      alert("Registration successful! You can now login.");
      navigate("/");
    } catch (error) {
      setLoading(false);
      console.error("Registration error:", error);
      setError(error.response?.data?.error || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">HED Student Registration</h3>
              {error && <div className="alert alert-danger">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      title="Please use your school email address (@shc.edu.ph)"
                      placeholder="username@shc.edu.ph"
                      required
                    />
                    <div className="form-text">
                      You must use your school email address ending with @shc.edu.ph
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="student_no" className="form-label">Student No.</label>
                      <input 
                      type="text" 
                      className="form-control"
                      id="student_no"
                      name="student_no"
                      placeholder="e.g., 22-01116"
                      value={formData.student_no}
                      onChange={handleChange}
                      required
                      />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="password" className="form-label">Password (domain password)</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="confirm_password" className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirm_password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="firstname" className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="firstname"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="lastname" className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="lastname"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                  <label htmlFor="course" className="form-label">Course</label>
                  <select
                    className="form-select"
                    id="course"
                    name="course"
                    value={formData.course}
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
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="phone_no" className="form-label">Phone No.</label>
                    <input 
                    type="number" 
                    className="form-control"
                    name="phone_no" 
                    id="phone_no"
                    value={formData.phone_no} 
                    onChange={handleChange}
                    required/>
                  </div>
                  
                </div>
                
                <div className="d-flex justify-content-center align-items-center">
                  <button type="submit" className="btn btn-primary w-50" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Registering...
                      </>
                    ) : (
                      "Register"
                    )}
                  </button>
                </div>
                <div className="d-flex justify-content-center align-items-center m-2">
                  <Link to="/register" className="btn btn-outline-secondary w-50">Back</Link>
                </div>
                
              </form>
          
              <div className="mt-3 text-center">
                <p>Already have an account? <Link to="/">Login here</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterHED;