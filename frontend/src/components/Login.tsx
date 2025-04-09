import * as React from "react";
import { useState } from "react";

const app_name = '167.172.31.171';

function buildPath(route: string): string {
  if (import.meta.env.MODE !== 'development') {
    return 'http://' + app_name + ':5001/' + route;
  } else {
    return 'http://localhost:5001/' + route;
  }
}

function Login() {
  const [message, setMessage] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setPassword] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  async function doLogin(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    setNeedsVerification(false);

    const obj = { login: loginName, password: loginPassword };

    try {
      const response = await fetch(buildPath('api/login'), {
        method: 'POST',
        body: JSON.stringify(obj),
        headers: { 'Content-Type': 'application/json' }
      });

      const res = JSON.parse(await response.text());

      if (res.error && res.error.includes('verification')) {
        setMessage(res.error);
        setNeedsVerification(true);
      } else if (res.id <= 0) {
        setMessage('User/Password combination incorrect');
      } else {
        const user = { firstName: res.firstName, lastName: res.lastName, email: res.email, id: res.id };
        localStorage.setItem('user_data', JSON.stringify(user));
        setMessage('');
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      alert(error.toString());
    }
  }

  return (
    <div className="login-wrapper"> {/* Wrapper added here */}
      <div className="login-container">
        <h2 className="login-title">Welcome Back!</h2>
        <form onSubmit={doLogin}>
          <div className="login-input-group">
            <div className="input-group">
              <input
                type="text"
                className="login-input"
                placeholder="Username"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                className="login-input"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
          {message && <p className="error-message">{message}</p>}
        </form>
      </div>
    </div>
  );
  
}  

export default Login;