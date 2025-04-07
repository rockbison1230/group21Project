import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import Register from '../components/Register';
import Navbar from '../components/Navbar'; // 💡 Importing Navbar
import './AuthPage.css';

function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login';

  return (
    <>
      <Navbar /> {/* 🧭 Navbar at the top */}
      <div className="auth-page">
        <div className="auth-wrapper">
          {/* Left: Image Section */}
          <div className="auth-image-section" />

          {/* Right: Form Section */}
          <div className="auth-form-section">
            {/* Toggle */}
            <div className="auth-toggle">
              <div
                className={`toggle-option ${isLogin ? 'active' : ''}`}
                onClick={() => navigate('/login')}
              >
                Login
              </div>
              <div
                className={`toggle-option ${!isLogin ? 'active' : ''}`}
                onClick={() => navigate('/register')}
              >
                Register
              </div>
              <div className={`slider ${isLogin ? 'slide-left' : 'slide-right'}`} />
            </div>

            {/* Sliding Forms */}
            <div className="auth-container">
              <div className={`form-slider ${isLogin ? 'show-login' : 'show-register'}`}>
                <div className="auth-form login-form">
                  <Login />
                </div>
                <div className="auth-form register-form">
                  <Register />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AuthPage;
