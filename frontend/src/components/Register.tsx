import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

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
        <View style={styles.container}>
            <Text style={styles.title}>REGISTER</Text>
            <TextInput
                style={styles.input}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
            />
            <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
            />
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={loginName}
                onChangeText={setLoginName}
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={true}
                value={loginPassword}
                onChangeText={setPassword}
            />
            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                secureTextEntry={true}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />
            <Button title="Register" onPress={doRegister} />
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <Text style={styles.footer}>
                Already have an account?{' '}
                <Text style={styles.link} onPress={() => (window.location.href = '/')}>
                    Login here
                </Text>
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    message: {
        marginTop: 15,
        textAlign: 'center',
        color: 'red',
    },
    footer: {
        marginTop: 20,
        textAlign: 'center',
    },
    link: {
        color: 'blue',
        textDecorationLine: 'underline',
    },
});


export default Register;