import React from "react";
import { Link } from "react-router-dom";

function RegisterOptions() {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">Student Registration</h3>
              <p className="text-center mb-4">Please select your education level:</p>
              
              <div className="d-grid gap-3">
                <Link to="/register/hed" className="btn btn-primary btn-lg">
                  Higher Education Department (HED)
                </Link>
                <Link to="/register/bed" className="btn btn-success btn-lg">
                  Basic Education Department (BED)
                </Link>
              </div>
              
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

export default RegisterOptions;