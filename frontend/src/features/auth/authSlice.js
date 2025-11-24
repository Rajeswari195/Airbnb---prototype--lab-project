// /frontend/src/features/auth/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: null,
  role: null,          // "TRAVELER" or "OWNER" in future
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action) {
      const { token, role } = action.payload || {};
      state.token = token || null;
      state.role = role || null;
      state.isAuthenticated = !!(token || role);
    },
    clearAuth(state) {
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
