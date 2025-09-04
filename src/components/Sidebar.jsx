import React from 'react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, onActiveTeamsClick }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="header-content">
            <h2>Menu</h2>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="sidebar-content">
          <div className="menu-top">
            <button className="simple-active-teams-button" onClick={onActiveTeamsClick}>
              Times Ativos
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;