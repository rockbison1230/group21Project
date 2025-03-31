import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import Navbar from '../components/Navbar';

function Landing() {
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    const user = localStorage.getItem('user_data');
    if (user) {
      navigate('/dashboard');
    }
  }, []);

  return (
    <>
    <Navbar />
    <div className="landing-hero">
      <div className="hero-content">
        <h1 className="brand-title">Espresso Events</h1>
        <h2 className="tagline">bean there, done that</h2>

        <div className="button-group">
          <button onClick={() => navigate('/register')} className="hero-btn">Create Invite</button>
          <button onClick={() => navigate('/')} className="hero-btn secondary">Get the App</button>
        </div>

        <div className="login-link">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{
                color: '#007bff',
                cursor: 'pointer',
                textDecoration: 'none',
            }}
            onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
            Login
        </span>
        </div>
      </div>
    </div>
    </>
  );
}

export default Landing;
