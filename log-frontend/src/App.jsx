import './App.css'
import Login from "./components/Login"
import SignUp from "./components/SignUp"
import Home from "./components/Home"
import { CssVarsProvider } from '@mui/joy/styles';
import theme from '/src/styles/theme';
import { Routes, Route } from "react-router-dom"
import PrivateRoute from './components/PrivateRoute';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import EditUser from './components/EditUser';
import NewStore from './components/NewStore';
import CompletedStores from './components/CompletedStores';
import InProgressStores from './components/InProgressStores';
import UpCommingStores from './components/UpcomingStores';
import AllUsers from './components/AllUsers';
import StoreDetails from './components/storeDetails';
import { useNavigate } from 'react-router-dom';
import { setupInterceptors } from './services/interceptors';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Slide } from 'react-toastify';



function App() {

  const navigate = useNavigate();

  useEffect(() => {
    setupInterceptors(navigate);
  }, [navigate]);

  return (
    <CssVarsProvider theme={theme}>
      {<Routes>
        <Route path="/" element={<Login />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/Home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/EditUser" element={<PrivateRoute><EditUser /></PrivateRoute>} />
        <Route path="/NewStore" element={<PrivateRoute><NewStore /></PrivateRoute>} />
        <Route path="/Completed" element={<PrivateRoute><CompletedStores /></PrivateRoute>} />
        <Route path="/InProgress" element={<PrivateRoute><InProgressStores /></PrivateRoute>} />
        <Route path="/Upcomming" element={<PrivateRoute><UpCommingStores /></PrivateRoute>} />
        <Route path="/Users" element={<PrivateRoute><AllUsers /></PrivateRoute>} />
        <Route path="/stores/:id" element={<PrivateRoute><StoreDetails /></PrivateRoute>} />
      </Routes>}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={true}
        rtl={false}
        //pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Slide}
      />
    </CssVarsProvider>
  );
}

export default App