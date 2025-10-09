import { Provider } from "react-redux";
import { Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import SplashScreen from "@/components/SplashScreen";
import useSplashScreen from "@/hooks/useSplashScreen";
import { setNavigate } from "@/lib/navigation";
import Login from "@/pages/Login";
import store from "@/store";

import ReportPage from "./components/Report";
import Layout from "./pages/Layout";


function App() {
  // set the navigate function on our API client for use in the axios error interceptor
  // this allows us to redirect to the login page when an auth error occurs
  const navigate = useNavigate();
  setNavigate(navigate);

  // Splash screen logic
  const { showSplash, isAppReady, hideSplash } = useSplashScreen();
  if (showSplash) {
    return <SplashScreen onFinish={hideSplash} />;
  }

  if (!isAppReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <Routes>
        <Route path="/login" element={<Login />} />
    
        {/* Các route chính sau khi login */}
        <Route path="/" element={<Layout />}>  
               <Route path="report" element={<ReportPage/>} />
        </Route>

      </Routes> 


      <ToastContainer position="top-right" autoClose={2000} />
    </Provider>
  );
}

export default App;
