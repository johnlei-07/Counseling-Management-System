import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";

import AdminLayout from "./components/admin/AdminLayout";
import CounselorLayout from "./components/counselor/CounselorLayout";
import CounselorDashboard from "./components/counselor/CounselorDashboard";
import CreateCounselor from "./components/admin/CreateCounselor";
import TableCounselor from "./components/admin/TableCounselor";
import StudentList from "./components/admin/StudentList";
import AdminDashboard from "./components/admin/AdminDashboard";

import ViewStudent from "./components/counselor/ViewStudent";
import UpdateStudentForm from "./components/counselor/UpdateStudentForm";
import StudentRemarks from "./components/counselor/StudentRemarks";
import AppointmentList from "./components/counselor/AppointmentList";
import AppointmentSchedule from "./components/counselor/AppointmentSchedule";
import AssignSchedule from './components/counselor/AssignSchedule';

import StudentLayout from "./components/student/StudentLayout";
import StudentDashboard from "./components/student/StudentDashboard";
import RequestAppointment from "./components/student/RequestAppointment";
import AppointmentStatus from './components/student/AppointmentStatus';


// Add these imports
import RegisterOptions from './RegisterOptions';
import RegisterHED from './RegisterHED';
import RegisterBED from './RegisterBED';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Add these new routes for student registration */}
        <Route path="/register" element={<RegisterOptions />} />
        <Route path="/register/hed" element={<RegisterHED />} />
        <Route path="/register/bed" element={<RegisterBED />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="create-counselor" element={<CreateCounselor />} />
          <Route path="list-counselors" element={<TableCounselor />} />
          <Route path="studentlist" element={<StudentList />} />
          <Route path="dashboard-stats" element={<AdminDashboard/>}/>
        </Route>

        {/* Counselor Routes - wrapped inside CounselorDashboard */}
        <Route path="/counselor" element={<CounselorLayout />}>
          <Route path="dashboard" element={<CounselorDashboard/>} />
          <Route path="students" element={<ViewStudent />} />
          <Route path="students/update/:id" element={<UpdateStudentForm />} />
          <Route path="students/:studentId/remarks" element={<StudentRemarks />} />
          <Route path="appointments" element={<AppointmentList/>}/>
          <Route path="schedule" element={<AppointmentSchedule />} />
          <Route path="assign" element={<AssignSchedule/>}/>
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="appointment" element={<RequestAppointment />} />
          <Route path="appointment-status" element={<AppointmentStatus />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
