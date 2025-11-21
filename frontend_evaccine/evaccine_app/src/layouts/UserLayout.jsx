import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";
import ChatWidget from "../components/ChatWidget";

export default function UserLayout({ user, setUser }) {
  return (
    <>
      <NavBar user={user} setUser={setUser} />
      <Outlet />
      <ChatWidget user={user} />
    </>
  );
}
