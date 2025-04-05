import PageTitle from '../components/PageTitle';
import Register from '../components/Register';
import Navbar from '../components/Navbar';

const RegisterPage = () => {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '75px', textAlign: 'center' }}>
        <PageTitle />
        <Register />
      </div>
    </>
  );
};

export default RegisterPage;