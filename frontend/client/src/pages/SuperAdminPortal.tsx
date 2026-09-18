import React, { useState, useEffect } from "react";
import SuperAdminLogin from "./SuperAdminLogin";
import SuperAdminDashboard from "./SuperAdminDashboard";

export default function SuperAdminPortal() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken =
      localStorage.getItem("pragati_token") ||
      sessionStorage.getItem("pragati_token");
    const role = localStorage.getItem("pragati_role");

    if (savedToken && (role === "SUPER_ADMIN" || savedToken === "demo_SUPER_ADMIN")) {
      setToken(savedToken);
    }
  }, []);

  const handleAuthenticated = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("pragati_token");
    localStorage.removeItem("pragati_role");
    sessionStorage.removeItem("pragati_token");
    setToken(null);
  };

  if (!token) {
    return <SuperAdminLogin onAuthenticated={handleAuthenticated} />;
  }

  return <SuperAdminDashboard onLogout={handleLogout} />;
}
