import PageTitle from '../components/PageTitle.tsx';
import Login from '../components/Login.tsx';
import Navbar from '../components/Navbar.tsx';

const LoginPage = () => {
  return (
    <div>
      <Navbar />
      <PageTitle />
      <Login />
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>New user? <a href="/register">Register here</a></p>
      </div>
    </div>
  );
};

export default LoginPage;
