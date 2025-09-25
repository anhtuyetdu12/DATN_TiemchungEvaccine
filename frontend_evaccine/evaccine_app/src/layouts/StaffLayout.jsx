import { Outlet } from "react-router-dom";
import StaffNavBar from "../components/StaffNavBar"; // Nếu muốn staff có navbar riêng
import Footer from "../components/Footer";

export default function StaffLayout({ user, setUser }) {
  return (
    <>
      <StaffNavBar user={user} setUser={setUser} />
      <Outlet />
      <Footer />
    </>
  );
}
