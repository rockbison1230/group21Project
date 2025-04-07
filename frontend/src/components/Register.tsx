import * as React from 'react';
import { useState } from 'react';
//import './Register.css';

const app_name = '167.172.31.171';

function buildPath(route: string): string {
  if (import.meta.env.MODE !== 'development') {
    return 'http://' + app_name + ':5001/' + route;
  }
  return 'http://localhost:5001/' + route;
}

function Register() {
  const [message, setMessage] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loginName, setLoginName] = useState('');
  const [email, setEmail] = useState('');
  const [loginPassword, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function doRegister(): Promise<void> {
    if (loginPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    const obj = {
      firstName,
      lastName,
      userName: loginName,
      emailAddress: email,
      password: loginPassword
    };

    try {
      const response = await fetch(buildPath('api/register'), {
        method: 'POST',
        body: JSON.stringify(obj),
        headers: { 'Content-Type': 'application/json' }
      });
      const res = JSON.parse(await response.text());

      if (res.error) {
        setMessage(res.error);
      } else {
        setMessage('Registration successful');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch (error: any) {
      alert(error.toString());
    }
  }

  return (
    <div className="register-container">
      <h2 className="register-title">REGISTER</h2>
      <input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="register-input" />
      <input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="register-input" />
      <input placeholder="Username" value={loginName} onChange={(e) => setLoginName(e.target.value)} className="register-input" />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="register-input" />
      <input placeholder="Password" type="password" value={loginPassword} onChange={(e) => setPassword(e.target.value)} className="register-input" />
      <input placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="register-input" />
      <button onClick={doRegister} className="register-button">Register</button>
      {message && <p className="register-message">{message}</p>}
      <p className="register-footer">
        Already have an account?{' '}
        <span className="register-link" onClick={() => (window.location.href = '/login')}>Login</span>
      </p>
    </div>
  );
}

export default Register;
