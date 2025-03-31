import * as React from 'react';
import { useState } from 'react';

const app_name = '167.172.31.171';

function buildPath(route: string): string {
  if (import.meta.env.MODE != 'development') {
    return 'http://' + app_name + ':5001/' + route;
  }
  else {
    return 'http://localhost:5001/' + route;
  }
}

function Register() {
  const [message, setMessage] = useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [loginName, setLoginName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [loginPassword, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  async function doRegister(): Promise<void> {
    if (loginPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    var obj = {
      firstName: firstName,
      lastName: lastName,
      userName: loginName,
      emailAddress: email,
      password: loginPassword
    };
    var js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/register'),
        {
          method: 'POST',
          body: js,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      var res = JSON.parse(await response.text());

      if (res.error) {
        setMessage(res.error);
      }
      else {
        setMessage('Registration successful');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    }
    catch (error: any) {
      alert(error.toString());
      return;
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>REGISTER</h2>
      <input
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <input
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <input
        style={styles.input}
        placeholder="Username"
        value={loginName}
        onChange={(e) => setLoginName(e.target.value)}
      />
      <input
        style={styles.input}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        style={styles.input}
        placeholder="Password"
        type="password"
        value={loginPassword}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        style={styles.input}
        placeholder="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button style={styles.button} onClick={doRegister}>Register</button>
      {message ? <p style={styles.message}>{message}</p> : null}
      <p style={styles.footer}>
        Already have an account?{' '}
        <span style={styles.link} onClick={() => (window.location.href = '/login')}>
          Login
        </span>
      </p>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '400px',
    margin: '0 auto',
    marginTop: '50px'
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  input: {
    height: '40px',
    width: '100%',
    border: '1px solid gray',
    borderRadius: '4px',
    marginBottom: '15px',
    padding: '0 10px',
    fontSize: '16px'
  },
  button: {
    backgroundColor: '#4CAF50',
    border: 'none',
    color: 'white',
    padding: '10px 15px',
    textAlign: 'center',
    fontSize: '16px',
    marginTop: '10px',
    cursor: 'pointer',
    borderRadius: '4px',
    width: '100%'
  },
  message: {
    marginTop: '15px',
    textAlign: 'center',
    color: 'red'
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center'
  },
  link: {
    color: 'blue',
    textDecoration: 'underline',
    cursor: 'pointer'
  }
} as const;

export default Register;