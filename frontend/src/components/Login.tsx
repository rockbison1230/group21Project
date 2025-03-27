import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const app_name = '167.172.31.171';
function buildPath(route:string) : string
{
    if (import.meta.env.MODE != 'development') 
    {
        return 'http://' + app_name + ':5001/' + route;
    }
    else
    {        
        return 'http://localhost:5001/' + route;
    }
}


function Login()
{
    const [message,setMessage] = useState('');
    const [loginName,setLoginName] = React.useState('');
    const [loginPassword,setPassword] = React.useState('');

    async function doLogin(event:any) : Promise<void>
    {
        event.preventDefault();

        var obj = {login:loginName,password:loginPassword};
        var js = JSON.stringify(obj);
  
        try
        {    
            const response = await fetch(buildPath('api/login'),
                {method:'POST',
                    body:js,
                    headers:{'Content-Type': 'application/json'}
                }
            );

            var res = JSON.parse(await response.text());
  
            if( res.id <= 0 )
            {
                setMessage('User/Password combination incorrect');
            }
            else
            {
                var user = {firstName: res.firstName, lastName: res.lastName, email: res.email, id: res.id};

                localStorage.setItem('user_data', JSON.stringify(user));
  
                setMessage('');
                window.location.href = '/cards';
            }
        }
        catch(error:any)
        {
            alert(error.toString());
            return;
        }    
      };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>PLEASE LOG IN</Text>
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={loginName}
                onChangeText={setLoginName}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={true}
                value={loginPassword}
                onChangeText={setPassword}
            />
            <Button title="Do It" onPress={doLogin} />
            {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        // You can add additional styling here
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center'
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
        color: 'red'
    },
});


export default Login;