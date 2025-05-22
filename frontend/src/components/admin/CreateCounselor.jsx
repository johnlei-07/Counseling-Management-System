import React, { useState, useEffect } from "react";
import axios from "axios";

function CreateCounselor() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm_password: "",
    firstname: "",
    lastname: ""
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 2000); // hide messages after 1.5s
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/admin/create/counselor-account",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setSuccessMessage("Counselor created successfully!");
      setForm({
        email: "",
        password: "",
        confirm_password: "",
        firstname: "",
        lastname: ""
      });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMessage("Error: " + err.response.data.message);
      } else {
        setErrorMessage("Error: Could not create counselor.");
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 w-100">
      <div className="w-50 mb-5 border border-success p-3 px-5 ">
      <h1 className="text-center mb-4 text-success">Add Counselor</h1>
        {/* Display success or error messages */}
        {successMessage && (
          <p style={{ color: "green", fontWeight: "bold", textAlign: "center" }}>
            {successMessage}
          </p>
        )}
        {errorMessage && (
          <p style={{ color: "red", fontWeight: "bold", textAlign: "center" }}>
            {errorMessage}
          </p>
        )}
  
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <label htmlFor="email" className="form-label">Email address</label>
          <input
            type="email"
            name="email"
            id="email"
            className="form-control border border-success rounded"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            className="form-control border border-success rounded"
            value={form.password}
            onChange={handleChange}
            required
          />
          <label htmlFor="confirm_password" className="form-label">Confirm Password</label>
          <input
            type="password"
            name="confirm_password"
            id="confirm_password"
            placeholder="Confirm Password"
            className="form-control border border-success rounded"
            value={form.confirm_password}
            onChange={handleChange}
            required
          />
          <label htmlFor="firstname" className="form-label">Firstname</label>
          <input
            type="text"
            name="firstname"
            id="firstname"
            placeholder="First Name"
            className="form-control border border-success rounded"
            value={form.firstname}
            onChange={handleChange}
            required
          />
          <label htmlFor="lastname" className="form-label">Lastname</label>
          <input
            type="text"
            name="lastname"
            id="lastname"
            placeholder="Last Name"
            className="form-control border border-success rounded"
            value={form.lastname}
            onChange={handleChange}
            required
          />
          
          <div className="d-flex justify-content-center align-items-center mt-3" >
            <button
            
              type="submit"
              className="btn btn-success w-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
}

export default CreateCounselor;
