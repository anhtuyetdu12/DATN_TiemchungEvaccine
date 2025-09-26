import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function UserLayout({ user, setUser }) {
  return (
    <>
      <NavBar user={user} setUser={setUser} />
      <Outlet />
    </>
  );
}
