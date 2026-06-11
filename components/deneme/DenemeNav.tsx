"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, BarChart3, Trophy, Bell, LogOut, Settings, Timer, MapPin } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import React, { useState, useEffect, useRef } from "react";

const links = [
  { href: "/dashboard", label: "Gösterge Paneli", icon: LayoutDashboard },
  { href: "/deneme", label: "Deneme Merkezi", icon: BarChart3 },
  { href: "/simulator", label: "Simülatör", icon: Timer },
  { href: "/liderlik", label: "Liderlik Tablosu", icon: Trophy },
  { href: "/etkinlik", label: "Etkinlikler", icon: MapPin },
];

export default function DenemeNav({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);
      
      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: isHidden ? -150 : 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 ${
        isScrolled ? "py-2" : "py-4"
      } px-4 md:px-8 flex justify-center pointer-events-none`}
    >
      <div 
        className={`pointer-events-auto flex items-center justify-between w-full max-w-[90rem] mx-auto rounded-2xl md:rounded-full px-4 md:px-6 py-3 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/70 dark:bg-[#1e293b]/70 backdrop-blur-xl shadow-lg border border-gray-200/50 dark:border-white/10" 
            : "bg-white/40 dark:bg-[#1e293b]/40 backdrop-blur-md shadow-sm border border-transparent"
        }`}
      >
        {/* Left Side: Logo + Nav */}
        <div className="flex items-center gap-4 lg:gap-8 shrink-0">
          {/* Logo Area */}
          <Link href="/dashboard" className="flex items-center gap-3 group focus:outline-none shrink-0">
            <div className="relative flex items-center justify-center w-[38px] h-[38px] rounded-[12px] bg-[#1cb0f6] text-white shadow-sm border-b-[3px] border-[#1899d6] transition-all group-hover:-translate-y-0.5 group-hover:shadow-md group-active:translate-y-[2px] group-active:border-b-0 group-active:mb-[3px]">
              <span className="font-black text-[22px] leading-none tracking-tighter">K</span>
            </div>
            <span className="font-black text-[22px] tracking-tighter text-slate-800 dark:text-white hidden lg:block">
              KPSS<span className="text-[#1cb0f6]">26</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              const Icon = link.icon;
              
              return (
                <Link 
                  key={link.label} 
                  href={link.href}
                  className="relative px-2 xl:px-4 py-2 rounded-full group transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="denemenav-indicator"
                      className="absolute inset-0 bg-gray-100 dark:bg-white/10 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-1.5 xl:gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"}`} />
                    <span className={`text-xs xl:text-sm font-medium ${isActive ? "text-gray-900 dark:text-white" : "text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"}`}>
                      {link.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Children + Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Children (Stats, etc) */}
          {children && (
            <div className="hidden xl:block">
              {children}
            </div>
          )}

          {/* Actions / Profile */}
          <div className="flex items-center gap-3 shrink-0">
          <button 
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <span className="text-xl">☀️</span> : <span className="text-xl">🌙</span>}
          </button>
          
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
          </button>
          
          <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block"></div>
          
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 cursor-pointer group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.email?.charAt(0).toUpperCase() || "U"
                )}
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 pointer-events-auto" 
                  onClick={() => setIsProfileOpen(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden z-50 pointer-events-auto"
                >
                  <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">{user?.displayName || "Kullanıcı"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsProfileSettingsOpen(true);
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors flex items-center gap-3 font-medium"
                    >
                      <Settings className="w-4 h-4 text-gray-400" /> Profil Ayarları
                    </button>
                    <div className="h-px w-full bg-gray-100 dark:bg-white/5 my-1" />
                    <button 
                      onClick={() => { setIsProfileOpen(false); signOut(); }}
                      className="w-full text-left px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-3 font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Çıkış Yap
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
          </div>
        </div>
      </div>
    </motion.header>

    <ProfileSettingsModal 
      isOpen={isProfileSettingsOpen} 
      onClose={() => setIsProfileSettingsOpen(false)} 
    />
    </>
  );
}
