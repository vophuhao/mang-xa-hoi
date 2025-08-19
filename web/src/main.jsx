import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { GoogleOAuthProvider } from '@react-oauth/google';
import queryClient from "./config/queryClient.js";

ReactDOM.createRoot(document.getElementById("root")).render(

 <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <ReactQueryDevtools position="bottom-right" initialIsOpen={false} />
      </BrowserRouter>
    </QueryClientProvider>
    </GoogleOAuthProvider>
);
