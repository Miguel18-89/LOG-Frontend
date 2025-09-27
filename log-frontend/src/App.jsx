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
import UpcomingStores from './components/UpcomingStores';
import AllUsers from './components/AllUsers';

function App() {
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
        <Route path="/Upcoming" element={<PrivateRoute><UpcomingStores /></PrivateRoute>} />
        <Route path="/Users" element={<PrivateRoute><AllUsers /></PrivateRoute>} />
      </Routes>}
    </CssVarsProvider>
  );
}

export default App