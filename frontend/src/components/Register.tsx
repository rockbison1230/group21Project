import { useState, useEffect } from 'react';

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
  const [showChecks, setShowChecks] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    number: false,
  });

  useEffect(() => {
    setPasswordValidations({
      length: loginPassword.length >= 6,
      uppercase: /[A-Z]/.test(loginPassword),
      number: /\d/.test(loginPassword),
    });
  }, [loginPassword]);

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
        setIsRegistered(true);
        setMessage('Registration successful. Please check your email for a verification code.');
        setTimeout(() => {
          window.location.href = '/verification';
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
      <input
        placeholder="Password"
        type="password"
        value={loginPassword}
        onChange={(e) => {
          setPassword(e.target.value);
          setShowChecks(true);
        }}
        className="register-input"
      />

      {showChecks && (
        <div className="password-checks" style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', margin: '8px 0' }}>
          <span className={passwordValidations.length ? 'valid' : 'invalid'}>
            {passwordValidations.length ? '✓' : '✗'} 6+ characters
          </span>
          <span className={passwordValidations.uppercase ? 'valid' : 'invalid'}>
            {passwordValidations.uppercase ? '✓' : '✗'} 1 uppercase
          </span>
          <span className={passwordValidations.number ? 'valid' : 'invalid'}>
            {passwordValidations.number ? '✓' : '✗'} 1 number
          </span>
        </div>
      )}

      <input placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="register-input" />
      {message && <p className="register-message">{message}</p>}

      <p className="register-footer">
        Already have an account?{' '}
        <span className="register-link" onClick={() => (window.location.href = '/login')}>Login</span>
      </p>
      <button onClick={doRegister} className="register-button">Register</button>
    </div>
  );
}

export default Register;
