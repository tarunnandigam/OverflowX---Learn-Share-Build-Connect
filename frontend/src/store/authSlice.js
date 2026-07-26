import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('token') || null;
let user = null;

try {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    user = JSON.parse(savedUser);
  }
} catch (error) {
  console.error('Failed to parse user details from local storage:', error);
}

const initialState = {
  user,
  token,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.isLoading = false;
      state.user = action.payload;
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    loginFailure(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isLoading = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    refreshTokenSuccess(state, action) {
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
      if (action.payload.user) {
        state.user = action.payload.user;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser, refreshTokenSuccess } = authSlice.actions;
export default authSlice.reducer;
