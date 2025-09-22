import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import App from "@/App.jsx";
import queryClient from "@/config/queryClient.js";

import store from "./store";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <BrowserRouter>
          <App />
          <ReactQueryDevtools position="bottom-right" initialIsOpen={false} />
        </BrowserRouter>
      </Provider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);
