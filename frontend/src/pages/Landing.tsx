import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';
import Navbar from '../components/Navbar';

function Landing() {
  const navigate = useNavigate();

  const [hiddenBeans, setHiddenBeans] = React.useState<number[]>([]);

  const handleBeanClick = (index: number) => {
    setHiddenBeans((prev) => [...prev, index]);
    setTimeout(() => {
      setHiddenBeans(prev => prev.filter(i => i !== index));
    }, 4000);
  };

  React.useEffect(() => {
    const user = localStorage.getItem('user_data');
    if (user) {
      navigate('/dashboard');
    }
  }, []);

  return (
    <div className="landing-wrapper">
      <Navbar />

      <div className="floating-beans">
        {/* Beans (clickable easter eggs) */}
        {[...Array(5)].map((_, i) =>
          !hiddenBeans.includes(i) && (
            <img
              key={i}
              src="/images/coffee_bean.png"
              alt={`bean${i}`}
              className={`bean bean${i + 1}`}
              onClick={() => handleBeanClick(i)}
              style={{ cursor: 'pointer' }}
            />
          )
        )}

        {/* Sparkles */}
        <div className="sparkle sparkle1"></div>
        <div className="sparkle sparkle2"></div>
        <div className="sparkle sparkle3"></div>
        <div className="sparkle sparkle4"></div>
        <div className="sparkle sparkle5"></div>
      </div>

      <div className="landing-hero">
        <div className="hero-content">
          <img src="/images/hero.jpg" alt="Espresso Hero" className="hero-image" />

          <div className="text-content">
            <h1 className="brand-title">Espresso Events</h1>
            <h2 className="tagline">bean there, done that</h2>

            <div className="button-group">
              <button onClick={() => navigate('/register')} className="hero-btn">
                Create Invite
              </button>
              <button onClick={() => navigate('/')} className="hero-btn secondary">
                Get the App
              </button>
            </div>

            <div className="login-link">
              Already have an account?{' '}
              <span
                onClick={() => navigate('/login')}
                style={{
                  color: '#007bff',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                }}
                onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Login
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
