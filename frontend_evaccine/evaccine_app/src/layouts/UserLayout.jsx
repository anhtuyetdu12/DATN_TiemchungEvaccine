import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

export default function UserLayout({ user, setUser }) {
  return (
    <>
      <NavBar user={user} setUser={setUser} />
      <Outlet />
      <Footer />
    </>
  );
}
