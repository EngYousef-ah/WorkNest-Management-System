import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const checkToken = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", checkToken);

    window.addEventListener("local-storage-change", checkToken);

    return () => {
      window.removeEventListener("storage", checkToken);
      window.removeEventListener("local-storage-change", checkToken);
    };
  }, []);

  if (!token) {
    return <Navigate to="/register" replace />;
  }

  return <Outlet />;
}