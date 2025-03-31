// src/components/Navbar.tsx
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <span className="navbar-logo" onClick={() => navigate('/')}>
        Espresso Events
      </span>
    </nav>
  );
}

export default Navbar;
