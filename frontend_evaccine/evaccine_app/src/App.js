import { Routes, Route } from "react-router-dom"; 
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css';
import axios from "axios";

import Footer from './components/Footer';
import NavBar from './components/NavBar';
import Home from "./pages/user/Home";
import RecordBook from "./pages/user/RecordBook";
import VaccineKnowledge from "./pages/user/VaccineKnowledge";
import VaccinesList from "./pages/user/VaccinesList";
import Register from "./pages/user/Register";
import Login from "./pages/user/Login";
import ForgotPassword from "./pages/user/ForgotPassword"
import ResetPassword from "./pages/user/ResetPassword"
import ProtectedRoute from "./layouts/ProtectedRoute";   
import ScrollToTop from "./layouts/ScrollToTop";
import DetailsVaccine from "./pages/user/DetailsVaccine";
import DetailsPackage from "./pages/user/DetailsPackage";
import BookingForm from "./pages/user/BookingForm";
import NotificationsUser from "./pages/user/NotificationsUser"

import StaffHome from "./pages/staff/StaffHome";
import StaffAppointments from "./pages/staff/StaffAppointments";
import StaffCustomers from "./pages/staff/StaffCustomers";
import StaffNotifications from "./pages/staff/StaffNotifications";
import StaffVCKnowledge from "./pages/staff/StaffVCKnowledge";
import StaffVaccines from "./pages/staff/StaffVaccines";

import ProtectedRouteStaff from "./layouts/ProtectedRouteStaff";
import UserLayout from "./layouts/UserLayout";
import StaffLayout from "./layouts/StaffLayout";
import StaffNavBar from "./components/StaffNavBar"
import { loadAuth, clearAllAuth, isJwtExpired , getStorage } from "./utils/authStorage";



function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false); 

    useEffect(() => {
      (async () => {
        const saved = loadAuth();
        const access = saved.access;
        const refresh = saved.refresh;

        if (!access && !refresh) {
          clearAllAuth();
          setUser(null);
          setAuthReady(true);
          return;
        }

        if (access && !isJwtExpired(access)) {
          try {
            await axios.post("http://127.0.0.1:8000/api/token/verify/", { token: access });
            const u = saved.user ? { ...saved.user, role: saved.user.role?.toLowerCase().trim() } : null;
            setUser(u);
            setAuthReady(true);
            return;
          } catch {
          }
        }

        if (refresh && !isJwtExpired(refresh)) {
          try {
            const { data } = await axios.post("http://127.0.0.1:8000/api/token/refresh/", { refresh });
            if (data.access) {
              saved.store.setItem("access", data.access);
              if (data.refresh) saved.store.setItem("refresh", data.refresh);
              const u = saved.user ? { ...saved.user, role: saved.user.role?.toLowerCase().trim() } : null;
              setUser(u);
              setAuthReady(true);
              return;
            }
          } catch {
          }
        }

        clearAllAuth();
        setUser(null);
        setAuthReady(true);
      })();
    }, []);

    useEffect(() => {
      const store = getStorage();
      const refresh = store.getItem("refresh");
      if (!refresh) return;
      const id = setInterval(async () => {
        try {
          const { data } = await axios.post("http://127.0.0.1:8000/api/token/refresh/", { refresh: store.getItem("refresh") });
          if (data.access) store.setItem("access", data.access);
          if (data.refresh) store.setItem("refresh", data.refresh); 
        } catch {
          clearAllAuth();
          window.location.href = "/login";
        }
      }, 20 * 60 * 1000);
      return () => clearInterval(id);
    }, []);
  

    return (
      <div className="App">
        {authReady && (user?.role === "staff" ? (
          <StaffNavBar user={user} setUser={setUser} />
        ) : (
          <NavBar user={user} setUser={setUser} />
        ))}

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
            <Route path="/packages/:slug" element={<DetailsPackage />} />
            <Route path="/bookingform" element={<ProtectedRoute user={user} authReady={authReady}><BookingForm /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute user={user} authReady={authReady}><NotificationsUser /></ProtectedRoute>}/>
            <Route path="/recordbook" element={<ProtectedRoute user={user} authReady={authReady}><RecordBook /></ProtectedRoute>} />
            {/* <Route path="/vaccines" element={<ProtectedRoute user={user} authReady={authReady}><VaccinesList /></ProtectedRoute>} />
            <Route path="/knowledge" element={<ProtectedRoute user={user} authReady={authReady}><VaccineKnowledge /></ProtectedRoute>} /> */}
            <Route path="/vaccines" element={<VaccinesList />} />
            <Route path="/knowledge" element={<VaccineKnowledge />} />
          </Route>

          {/* Staff routes */}
          <Route element={<StaffLayout user={user} setUser={setUser} />}>
            <Route path="/staff/home" element={<ProtectedRouteStaff user={user} authReady={authReady}><StaffHome /></ProtectedRouteStaff>} />
            <Route path="/staff/appointments" element={<ProtectedRouteStaff user={user} authReady={authReady}><StaffAppointments /></ProtectedRouteStaff>}/>
            <Route path="/staff/customers" element={<ProtectedRouteStaff user={user} authReady={authReady}><StaffCustomers /></ProtectedRouteStaff>}/>
            <Route path="/staff/notifications" element={<ProtectedRouteStaff user={user} authReady={authReady}><StaffNotifications /></ProtectedRouteStaff>} />
            <Route path="/staff/vaccination_knowledge" element={<ProtectedRouteStaff user={user} authReady={authReady}><StaffVCKnowledge /></ProtectedRouteStaff>} />
            <Route path="/staff/vaccines" element={<ProtectedRouteStaff user={user} authReady={authReady}><StaffVaccines /></ProtectedRouteStaff>} />
          </Route>
        </Routes>


        <Footer />

        <ToastContainer  position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false}
                      closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover/>
      </div>

      
    );

}

export default App;
