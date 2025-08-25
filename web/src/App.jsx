import { Route, Routes, useNavigate } from "react-router-dom";
import AppContainer from "./components/AppContainer";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import { setNavigate } from "./lib/navigation";
import Home from "./pages/Home";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Provider } from "react-redux";
import store from "./store";

function App() {
  // set the navigate function on our API client for use in the axios error interceptor
  // this allows us to redirect to the login page when an auth error occurs
  const navigate = useNavigate();
  setNavigate(navigate);

  return (
    <Provider store={store}>
      <Routes>
        <Route path="/" element={<AppContainer />}>
          <Route index element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/home" element={<Home />}></Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/email/verify/:code" element={<VerifyEmail />} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/password/reset" element={<ResetPassword />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={1000} />
    </Provider>
  );
}

export default App;
