import React, { Suspense, lazy } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Scroll to top of viewport on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

// Lazy-loaded Pages
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Feed = lazy(() => import('../pages/Feed'));
const Verify = lazy(() => import('../pages/Verify'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const Settings = lazy(() => import('../pages/Settings'));
const Profile = lazy(() => import('../pages/Profile'));
const QuestionDetail = lazy(() => import('../pages/QuestionDetail'));
const Users = lazy(() => import('../pages/Users'));
const Tags = lazy(() => import('../pages/Tags'));
const AskQuestion = lazy(() => import('../pages/AskQuestion'));
const SocialSpace = lazy(() => import('../pages/SocialSpace'));
const Contact = lazy(() => import('../pages/Contact'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Layout Components
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PhoneVerificationModal from '../components/common/PhoneVerificationModal';

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
    <div className="w-10 h-10 border-4 border-[#0A95FF] border-t-transparent rounded-full animate-spin"></div>
    <span className="text-gray-500 text-xs font-semibold">Loading Page...</span>
  </div>
);

const DashboardLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Navbar />
      <div className="flex-1 flex w-full max-w-[1264px] mx-auto mt-[50px] relative justify-center">
        <Sidebar />
        <main className="flex-1 max-w-[1100px] w-full bg-white sm:p-6 p-4 md:border-l border-gray-200 min-h-screen">
          <Outlet />
          <PhoneVerificationModal />
        </main>
      </div>
      <Footer />
    </div>
  );
};

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F1F2F3] dark:bg-[#0b0f19] font-sans">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-[50px] w-full">
        <Outlet />
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />
      <Routes>
        {/* Public Pages */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Verification page (accessible only to logged in but unverified users) */}
        <Route element={<ProtectedRoute allowUnverified={true} />}>
          <Route path="/verify" element={<Verify />} />
        </Route>

        {/* Public viewable pages with layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Feed />} />
          <Route path="/questions" element={<Feed />} />
          <Route path="/questions/:id" element={<QuestionDetail />} />
          <Route path="/users" element={<Users />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Protected Routes Group */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/social" element={<SocialSpace />} />
            <Route path="/questions/ask" element={<AskQuestion />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
