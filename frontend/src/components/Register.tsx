import React, { useState } from 'react'

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

  async function doRegister(event: any): Promise<void> {
    event.preventDefault();

    // Check if passwords match
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

  function handleSetFirstName(e: any): void {
    setFirstName(e.target.value);
  }

  function handleSetLastName(e: any): void {
    setLastName(e.target.value);
  }

  function handleSetLoginName(e: any): void {
    setLoginName(e.target.value);
  }

  function handleSetEmail(e: any): void {
    setEmail(e.target.value);
  }

  function handleSetPassword(e: any): void {
    setPassword(e.target.value);
  }

  function handleSetConfirmPassword(e: any): void {
    setConfirmPassword(e.target.value);
  }

  return (
    <div id="registerDiv">
      <span id="inner-title">REGISTER</span><br />
      First Name: <input type="text" id="firstName" placeholder="First Name"
        onChange={handleSetFirstName} /><br />
      Last Name: <input type="text" id="lastName" placeholder="Last Name"
        onChange={handleSetLastName} /><br />
      Login: <input type="text" id="loginName" placeholder="Username"
        onChange={handleSetLoginName} /><br />
      Email: <input type="text" id="email" placeholder="Email"
        onChange={handleSetEmail} /><br />
      Password: <input type="password" id="loginPassword" placeholder="Password"
        onChange={handleSetPassword} /><br />
      Confirm Password: <input type="password" id="confirmPassword" placeholder="Confirm Password"
        onChange={handleSetConfirmPassword} /><br />
      <input type="submit" id="registerButton" className="buttons" value="Register"
        onClick={doRegister} />
      <span id="registerResult">{message}</span>
      <p>
        Already have an account? <a href="/">Login</a>
      </p>
    </div>
  );
}

export default Register;