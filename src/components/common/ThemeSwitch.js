import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeSwitch.css';

const ThemeSwitch = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="theme-switch-wrapper">
      <span className="theme-label">Dark Mode</span>
      <button 
        className={`theme-button ${isDarkMode ? 'active' : ''}`}
        onClick={toggleTheme}
      >
        {isDarkMode ? 'ON' : 'OFF'}
      </button>
    </div>
  );
};

export default ThemeSwitch; 