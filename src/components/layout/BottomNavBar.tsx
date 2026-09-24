import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Wrench, History, Settings } from 'lucide-react';

const MAIN_TAB_PATHS = ['/', '/tools', '/history', '/settings'];

export const BottomNavBar: React.FC = () => {
  const location = useLocation();

  if (!MAIN_TAB_PATHS.includes(location.pathname)) {
    return null;
  }

  return (
    <div className="bottom-nav-wrapper">
      <div className="bottom-nav-bar">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={20} />
          <span>HOME</span>
        </NavLink>

        <NavLink to="/tools" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wrench size={20} />
          <span>TOOLS</span>
        </NavLink>

        <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={20} />
          <span>HISTORY</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>SETTINGS</span>
        </NavLink>
      </div>
    </div>
  );
};

