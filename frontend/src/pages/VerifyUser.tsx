import { useState } from 'react';

const app_name = '167.172.31.171';

function buildPath(route: string): string {
  if (import.meta.env.MODE !== 'development') {
    return 'http://' + app_name + ':5001/' + route;
  } else {
    return 'http://localhost:5001/' + route;
  }
}

function VerifyAccount() {
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function doVerify(event: React.FormEvent) {
    event.preventDefault();
    
    if (!token.trim()) {
      setMessage('Please enter the verification token sent to your email.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(buildPath('api/verify'), {
        method: 'POST',
        body: JSON.stringify({ token }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const res = JSON.parse(await response.text());

      if (response.ok) {
        setMessage('Verification successful! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setMessage(res.message || 'Verification failed. Please try again.');
      }
    } catch (error: any) {
      setMessage('An error occurred during verification.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f3e2c7, #e4d1ad)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Left side with illustration */}
        <div style={{
          flex: '1',
          backgroundColor: '#fdf6e9',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px'
        }}>
          <img 
            src="./images/logo.png" 
            alt="Bean There Done That" 
            style={{
              maxWidth: '300px',
              marginBottom: '20px'
            }}
          />
        </div>

        {/* Right side with form */}
        <div style={{
          flex: '1',
          backgroundColor: 'white',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            color: '#4b3621',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            VERIFY ACCOUNT
          </h2>
          
          <p style={{ 
            marginBottom: '20px', 
            textAlign: 'center',
            color: '#666'
          }}>
            Please enter the verification code that was sent to your email address.
          </p>
          
          <form onSubmit={doVerify}>
            <div style={{ marginBottom: '20px' }}>
              <input 
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Verification Code"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <button 
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#5a3215',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                marginBottom: '15px'
              }}
            >
              {isLoading ? 'Verifying...' : 'Verify Account'}
            </button>
            
            {message && (
              <p style={{ 
                padding: '10px', 
                borderRadius: '4px',
                textAlign: 'center',
                backgroundColor: message.includes('successful') ? '#d4edda' : '#f8d7da',
                color: message.includes('successful') ? '#155724' : '#721c24',
                marginBottom: '15px'
              }}>
                {message}
              </p>
            )}
            
            <p style={{ 
              textAlign: 'center',
              fontSize: '14px',
              color: '#666'
            }}>
              Already verified?{' '}
              <span 
                onClick={() => window.location.href = '/login'}
                style={{
                  color: '#5a3215',
                  textDecoration: 'underline',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Login
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VerifyAccount;