import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SiteProvider } from './context/SiteContext';
import { NotificationProvider } from './context/NotificationContext';
import { PublicLayout } from './components/PublicLayout';
import { HomePage } from './pages/HomePage';
import { SchemesListPage } from './pages/SchemesListPage';
import { SchemeDetailPage } from './pages/SchemeDetailPage';
import { PropertiesListPage } from './pages/PropertiesListPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { AboutPage, ContactPage, LegalPage, ServicesPage } from './pages/AboutServicesContactPages';
import {
  CustomerForgotPasswordPage,
  CustomerLoginPage,
  CustomerRegisterPage,
} from './pages/CustomerAuthPages';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SiteProvider>
          <NotificationProvider>
            <Routes>
          {/* Separate Secure Admin Routes (outside PublicLayout) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/*" element={<AdminDashboardPage />} />

          {/* Public & Customer Portal Routes */}
          <Route
            path="*"
            element={
              <PublicLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/projects" element={<SchemesListPage />} />
                  <Route path="/projects/:slug" element={<SchemeDetailPage />} />
                  <Route path="/schemes" element={<SchemesListPage />} />
                  <Route path="/al-jalil-garden" element={<SchemeDetailPage forcedSlug="al-jalil-garden" />} />
                  <Route path="/schemes/:slug" element={<SchemeDetailPage />} />
                  <Route path="/properties" element={<PropertiesListPage />} />
                  <Route path="/properties/:id" element={<PropertyDetailPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/login" element={<CustomerLoginPage />} />
                  <Route path="/register" element={<CustomerRegisterPage />} />
                  <Route path="/forgot-password" element={<CustomerForgotPasswordPage />} />
                  <Route path="/dashboard" element={<CustomerDashboardPage />} />
                  <Route path="/privacy" element={<LegalPage mode="privacy" />} />
                  <Route path="/terms" element={<LegalPage mode="terms" />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </PublicLayout>
            }
          />
            </Routes>
          </NotificationProvider>
        </SiteProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
