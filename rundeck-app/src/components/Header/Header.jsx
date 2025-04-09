import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import reactImage from '../../assets/logoblancosan.png';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  
  const handleLogoClick = () => {
    window.location.href = '/'; // Esto recargará la página completa
  };
  
  return (
    <header className="header">
      <div className="logo-container">
        <div onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <img src={reactImage} alt="Logo" className="logo" />
        </div>
        <h1 
          className="
            m-0 
            font-['Roboto_Condensed']
            text-center
            text-5xl 
            bg-gradient-to-r from-[#3b5486] via-[#03d5ff] to-[#3b5486] 
            bg-clip-text 
            text-transparent 
            drop-shadow-lg"
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        >
          Web IaaS
        </h1>
      </div>
      
      {user && (
        <div className="user-menu">
          <Link to="/">Home</Link>
          <span className="username">
            {user.fullName || user.username}
          </span>
          <button className="logout-button" onClick={logout}>
            Cerrar Sesión
          </button>
        </div>
      )}
    </header>
  );
}