import React from 'react';
import './RefreshButton.css';

const RefreshButton = ({ onClick, isDisabled = false, title = 'Refrescar tabla', isRefreshing = false }) => {
  return (
    <button 
      className={`refresh-button ${isDisabled ? 'disabled' : ''} ${isRefreshing ? 'refreshing' : ''}`}
      onClick={onClick}
      disabled={isDisabled || isRefreshing}
      title={title}
    >
      <span className="refresh-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
      </span>
      <span className="refresh-text">{isRefreshing ? 'Actualizando...' : 'Refrescar'}</span>
    </button>
  );
};

export default RefreshButton;