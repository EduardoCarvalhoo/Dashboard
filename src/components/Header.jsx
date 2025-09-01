import React from 'react';
import './Header.css';

const Header = ({ onMenuClick }) => {
  return (
    <header className="header">
      <button className="menu-button" onClick={onMenuClick} aria-label="Menu">
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </button>
      <h1 className="header-title">Dashboard de Times</h1>
    </header>
  );
};

export default Header;