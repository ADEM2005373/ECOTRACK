import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import App from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SupervisionPage from './pages/SupervisionPage';
import QualificationPage from './pages/agent/QualificationPage';
import AiGovernancePage from './pages/admin/AiGovernancePage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import AuditTrailPage from './pages/admin/AuditTrailPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<App />} />
            <Route path="/supervision" element={<SupervisionPage />} />
            <Route path="/agent/qualification" element={<QualificationPage />} />
            <Route path="/qualification" element={<QualificationPage />} />
            <Route path="/admin/ai-governance" element={<AiGovernancePage />} />
            <Route path="/ai-governance" element={<AiGovernancePage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/audit" element={<AuditTrailPage />} />
            <Route path="/audit" element={<AuditTrailPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
