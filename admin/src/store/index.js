import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import layoutReducer from "./slices/layoutSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    layout: layoutReducer,
  },
});

export default store;
