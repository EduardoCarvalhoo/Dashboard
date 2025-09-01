import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, onTeamSelect }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workspaces/del-tech/projects/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTeams(data.results || data || []);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar times:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = (team) => {
    onTeamSelect(team);
  };

  const getTeamIcon = (team) => {
    if (team.logo_props && team.logo_props.emoji && team.logo_props.emoji.url) {
      return (
        <img 
          src={team.logo_props.emoji.url} 
          alt={team.name}
          className="team-icon-img"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
      );
    }
    return <span className="team-icon-fallback">👥</span>;
  };

  useEffect(() => {
    if (isOpen && teams.length === 0) {
      fetchTeams();
    }
  }, [isOpen]);

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="header-content">
            <h2>Times</h2>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="sidebar-content">
          {/* Loading State */}
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Carregando times...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="error">
              <p>Erro: {error}</p>
              <button 
                onClick={fetchTeams} 
                className="retry-button"
              >
                Tentar novamente
              </button>
            </div>
          )}
          
          {/* Teams List */}
          {!loading && !error && (
            <>
              {teams.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum time encontrado</p>
                </div>
              ) : (
                <ul className="teams-list">
                  {teams.map((team) => (
                    <li key={team.id} className="team-item" onClick={() => handleTeamClick(team)}>
                      <div className="team-icon">
                        {getTeamIcon(team)}
                        <span className="team-icon-fallback" style={{display: 'none'}}>👥</span>
                      </div>
                      <span className="team-name">{team.name}</span>
                      <span className="arrow">→</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;