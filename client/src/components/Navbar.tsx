import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageCircle, 
  Users, 
  Phone, 
  Settings, 
  Menu, 
  X, 
  Search,
  Moon,
  Sun,
  Bell,
  User,
  LogOut,
  Bookmark,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  unreadCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ unreadCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const mainNavItems: NavItem[] = [
    { 
      id: 'chats', 
      label: 'Chatlar', 
      icon: (
        <div className="relative">
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      ), 
      path: '/chat' 
    },
    { id: 'contacts', label: 'Kontaktlar', icon: <Users size={24} />, path: '/contacts' },
    { id: 'calls', label: 'Qo\'ng\'iroqlar', icon: <Phone size={24} />, path: '/calls' },
    { id: 'settings', label: 'Sozlamalar', icon: <Settings size={24} />, path: '/settings' },
  ];

  const menuItems: NavItem[] = [
    { id: 'profile', label: 'Profil', icon: <User size={20} />, path: '/profile' },
    { id: 'saved', label: 'Saqlangan xabarlar', icon: <Bookmark size={20} />, path: '/saved' },
    { id: 'notifications', label: 'Bildirishnomalar', icon: <Bell size={20} />, path: '/notifications' },
    { id: 'help', label: 'Yordam', icon: <HelpCircle size={20} />, path: '/help' },
  ];

  const isActive = (path?: string) => path && location.pathname === path;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-20 bg-telegram-bg-light border-r border-telegram-bg-lighter">
        {/* Logo */}
        <div className="p-4 flex justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-telegram-blue to-telegram-blue-light flex items-center justify-center">
            <MessageCircle size={24} className="text-white" />
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-2">
            {mainNavItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => item.path && navigate(item.path)}
                  className={`w-full p-4 flex flex-col items-center gap-1 transition-colors relative group ${
                    isActive(item.path)
                      ? 'text-telegram-blue'
                      : 'text-telegram-text-secondary hover:text-telegram-text'
                  }`}
                >
                  {isActive(item.path) && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-telegram-blue rounded-r-full" />
                  )}
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-telegram-bg-lighter">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-telegram-blue to-telegram-blue-light flex items-center justify-center text-white font-bold mx-auto hover:opacity-90 transition-opacity"
          >
            {user?.displayName?.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-telegram-bg-light border-t border-telegram-bg-lighter z-50">
        <nav className="flex justify-around py-2">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.path && navigate(item.path)}
              className={`p-3 flex flex-col items-center gap-1 transition-colors ${
                isActive(item.path)
                  ? 'text-telegram-blue'
                  : 'text-telegram-text-secondary'
              }`}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-telegram-bg-light border-b border-telegram-bg-lighter z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors"
        >
          <Menu size={24} className="text-telegram-text" />
        </button>
        
        <h1 className="text-lg font-bold text-telegram-text flex items-center gap-2">
          <MessageCircle size={24} className="text-telegram-blue" />
          Telegram
        </h1>

        <button className="p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors">
          <Search size={24} className="text-telegram-text-secondary" />
        </button>
      </div>

      {/* Slide-out Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-telegram-bg-light z-50 shadow-xl animate-slide-in">
            {/* User Header */}
            <div className="p-6 bg-gradient-to-br from-telegram-blue to-telegram-blue-light">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
              
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold mb-3">
                {user?.displayName?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-white font-bold text-lg">{user?.displayName}</h2>
              <p className="text-white/70 text-sm">{user?.phone}</p>
            </div>

            {/* Menu Items */}
            <nav className="py-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.path) navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-6 py-3 flex items-center gap-4 text-telegram-text hover:bg-telegram-bg-lighter transition-colors"
                >
                  <span className="text-telegram-text-secondary">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="border-t border-telegram-bg-lighter my-2" />

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full px-6 py-3 flex items-center gap-4 text-telegram-text hover:bg-telegram-bg-lighter transition-colors"
            >
              <span className="text-telegram-text-secondary">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </span>
              <span>{isDarkMode ? 'Yorug\' rejim' : 'Qorong\'u rejim'}</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 flex items-center gap-4 text-telegram-error hover:bg-telegram-bg-lighter transition-colors"
            >
              <LogOut size={20} />
              <span>Chiqish</span>
            </button>

            {/* Version */}
            <div className="absolute bottom-4 left-6 text-telegram-text-secondary text-xs">
              Telegram Clone v1.0.0
            </div>
          </div>
        </>
      )}
    </>
  );
};
