// src/components/Navbar.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Show buttons only on landing page
  const showAuthButtons = location.pathname === '/';

  return (
    <nav className="navbar">
      <span className="navbar-logo" onClick={() => navigate('/')}>
        Espresso Events
      </span>

      {showAuthButtons && (
        <div className="navbar-buttons">
          <button className="navbar-button" onClick={() => navigate('/login')}>
            Login
          </button>
          <button className="navbar-button" onClick={() => navigate('/register')}>
            Register
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
