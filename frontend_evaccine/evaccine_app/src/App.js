import { Routes, Route } from "react-router-dom"; 
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css';

import Footer from './components/Footer';
import NavBar from './components/NavBar';
import Home from "./pages/user/Home";
import RecordBook from "./pages/user/RecordBook";
import Appointments from "./pages/user/Appointments";
import VaccineKnowledge from "./pages/user/VaccineKnowledge";
import VaccinesList from "./pages/user/VaccinesList";
import Register from "./pages/user/Register";
import Login from "./pages/user/Login";
import ForgotPassword from "./pages/user/ForgotPassword"
import ResetPassword from "./pages/user/ResetPassword"
import ProtectedRoute from "./layouts/ProtectedRoute";   
import ScrollToTop from "./layouts/ScrollToTop";
import DetailsVaccine from "./pages/user/DetailsVaccine";
import BookingForm from "./pages/user/modal/BookingForm";

import StaffHome from "./pages/staff/StaffHome";
import StaffAppointments from "./pages/staff/StaffAppointments";
import StaffCustomers from "./pages/staff/StaffCustomers";
import StaffNotifications from "./pages/staff/StaffNotifications";
import StaffReports from "./pages/staff/StaffReports";
import StaffVaccines from "./pages/staff/StaffVaccines";

import ProtectedRouteStaff from "./layouts/ProtectedRouteStaff";
import UserLayout from "./layouts/UserLayout";
import StaffLayout from "./layouts/StaffLayout";
import StaffNavBar from "./components/StaffNavBar"



function App() {
  const [user, setUser] = useState(() => {
  const saved = localStorage.getItem("user");
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        role: parsed.role?.toLowerCase().trim(), // chuẩn hóa ở đây luôn
      };
    } catch {
      return null;
    }
  });


  return (
    <div className="App">
      {/* Navbar luôn hiển thị */}
      {user?.role === "staff" ? (
        <StaffNavBar user={user} setUser={setUser} />
      ) : user?.role === "customer" ? (
        <NavBar user={user} setUser={setUser} />
      ) : (
        <NavBar user={user} setUser={setUser} /> // fallback cho chưa login
      )}

      <ScrollToTop />

      {/* Các route */}
      <Routes>
        {/* Public routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* User routes */}
        <Route element={<UserLayout user={user} setUser={setUser} />}>
          <Route path="/" element={<Home />} />
          <Route path="/vaccines/:slug" element={<DetailsVaccine />} />
          <Route path="/bookingform" element={<BookingForm />} />
          <Route path="/recordbook" element={<ProtectedRoute user={user}><RecordBook /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute user={user}><Appointments /></ProtectedRoute>} />
          <Route path="/vaccines" element={<ProtectedRoute user={user}><VaccinesList /></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute user={user}><VaccineKnowledge /></ProtectedRoute>} />
        </Route>

        {/* Staff routes */}
        <Route element={<StaffLayout user={user} setUser={setUser} />}>
          <Route path="/staff/home" element={<ProtectedRouteStaff user={user}><StaffHome /></ProtectedRouteStaff>} />
          <Route path="/staff/appointments" element={<ProtectedRouteStaff user={user}><StaffAppointments /></ProtectedRouteStaff>}/>
          <Route path="/staff/customers" element={<ProtectedRouteStaff user={user}><StaffCustomers /></ProtectedRouteStaff>}/>
          <Route path="/staff/notifications" element={<ProtectedRouteStaff user={user}><StaffNotifications /></ProtectedRouteStaff>} />
          <Route path="/staff/reports" element={<ProtectedRouteStaff user={user}><StaffReports /></ProtectedRouteStaff>} />
          <Route path="/staff/vaccines" element={<ProtectedRouteStaff user={user}><StaffVaccines /></ProtectedRouteStaff>} />
        </Route>
      </Routes>


      <Footer />

      <ToastContainer  position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false}
                    closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover/>
    </div>

    
  );
}

export default App;
