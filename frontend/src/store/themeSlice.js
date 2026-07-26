import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    const isDark = savedTheme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return isDark;
  }
  
  // Default fallback to light mode
  document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', 'light');
  return false;
};

const initialState = {
  darkMode: getInitialTheme(),
  mobileSidebarOpen: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.darkMode = !state.darkMode;
      const themeVal = state.darkMode ? 'dark' : 'light';
      localStorage.setItem('theme', themeVal);
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    toggleMobileSidebar(state) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    closeMobileSidebar(state) {
      state.mobileSidebarOpen = false;
    },
  },
});

export const { toggleTheme, toggleMobileSidebar, closeMobileSidebar } = themeSlice.actions;
export default themeSlice.reducer;
