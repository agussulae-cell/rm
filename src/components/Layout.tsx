import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { cn } from "../lib/utils";
import { 
  Boxes, 
  History, 
  PackageOpen, 
  Truck, 
  Users, 
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) {
    return <Outlet />; // For login page
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/", icon: Boxes, roles: ["PPIC", "IN", "OUT"] },
    { label: "Transaksi IN", path: "/in", icon: PackageOpen, roles: ["PPIC", "IN"] },
    { label: "Transaksi OUT", path: "/out", icon: Truck, roles: ["PPIC", "OUT"] },
    { label: "Riwayat", path: "/history", icon: History, roles: ["PPIC", "IN", "OUT"] },
    { label: "Master Part", path: "/master", icon: Settings, roles: ["PPIC"] },
    { label: "User", path: "/users", icon: Users, roles: ["PPIC"] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(user.role));

  const pageTitle = allowedNavItems.find(item => item.path === location.pathname)?.label || "App";

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-widest text-blue-400">STOCK CONTROL</span>
            <span className="text-xs text-gray-400">WAREHOUSE SYSTEM</span>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 shadow-sm z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden text-gray-600 hover:text-gray-900"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu size={24} />
              </button>
              <h1 className="text-lg font-bold text-gray-800 hidden sm:block">{pageTitle}</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-900">{user.fullname}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
