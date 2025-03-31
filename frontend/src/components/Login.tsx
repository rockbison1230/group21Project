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

  async function doLogin(event: React.FormEvent) {
    event.preventDefault();
    var obj = { login: loginName, password: loginPassword };
    var js = JSON.stringify(obj);
    
    try {
      const response = await fetch(buildPath('api/login'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });
      
      var res = JSON.parse(await response.text());
      if (res.id <= 0) {
        setMessage('User/Password combination incorrect');
      } else {
        var user = { firstName: res.firstName, lastName: res.lastName, email: res.email, id: res.id };
        localStorage.setItem('user_data', JSON.stringify(user));
        setMessage('');
        window.location.href = '/dashboard';
      }
    } catch(error: any) {
      alert(error.toString());
      return;
    }
  }

  return (
    <div className="login-container">
      <h2 className="login-title">PLEASE LOG IN</h2>
      <form onSubmit={doLogin}>
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
        <button type="submit" className="login-button">
          Do It
        </button>
        {message && <p className="error-message">{message}</p>}
      </form>
    </div>
  );
}

// Add this CSS to your App.css or create a Login.css file
/*
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
  height: 100vh;
}

.login-title {
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
}

.input-group {
  width: 100%;
  margin-bottom: 15px;
}

.login-input {
  width: 100%;
  height: 40px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 16px;
  box-sizing: border-box;
}

.login-button {
  width: 100%;
  height: 40px;
  background-color: #5a3215;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
}

.login-button:hover {
  background-color: #7a4225;
}

.error-message {
  color: red;
  margin-top: 15px;
  text-align: center;
}
*/

export default Login;