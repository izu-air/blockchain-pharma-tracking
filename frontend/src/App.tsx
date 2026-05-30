import { Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WalletProvider } from "./context/WalletContext";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AuditLogPage from "./pages/AuditLogPage";
import DistributorDashboardPage from "./pages/DistributorDashboardPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import ManufacturerDashboardPage from "./pages/ManufacturerDashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
import PharmacyDashboardPage from "./pages/PharmacyDashboardPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import RegisterProductPage from "./pages/RegisterProductPage";
import RecallPage from "./pages/RecallPage";
import TransferProductPage from "./pages/TransferProductPage";
import VerifyProductPage from "./pages/VerifyProductPage";

/**
 * Inner shell sees both contexts.  Wallet account-change events propagate to
 * AuthContext so a forged tab keeping the old JWT after the user switches
 * MetaMask account gets immediately logged out.
 */
function Shell() {
  const auth = useAuth();
  return (
    <WalletProvider onAccountsChanged={auth.onWalletAccountsChanged}>
      <Layout>
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/"        element={<DashboardPage />} />
          <Route path="/verify"  element={<VerifyProductPage />} />
          <Route path="/login"   element={<LoginPage />} />

          {/* ── Manufacturer ── */}
          <Route path="/manufacturer" element={
            <ProtectedRoute
              allowedBackendRoles={["MANUFACTURER", "ADMIN"]}
              allowedWalletRoles={["MANUFACTURER", "ADMIN"]}
            >
              <ManufacturerDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/register" element={
            <ProtectedRoute
              allowedBackendRoles={["MANUFACTURER", "ADMIN"]}
              allowedWalletRoles={["MANUFACTURER", "ADMIN"]}
              requireWallet
              requireCorrectChain
            >
              <RegisterProductPage />
            </ProtectedRoute>
          } />

          {/* ── Distributor / Pharmacy ── */}
          <Route path="/distributor" element={
            <ProtectedRoute
              allowedBackendRoles={["DISTRIBUTOR", "ADMIN"]}
              allowedWalletRoles={["DISTRIBUTOR", "ADMIN"]}
            >
              <DistributorDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy" element={
            <ProtectedRoute
              allowedBackendRoles={["PHARMACY", "ADMIN"]}
              allowedWalletRoles={["PHARMACY", "ADMIN"]}
            >
              <PharmacyDashboardPage />
            </ProtectedRoute>
          } />

          {/* ── Transfer / Recall ── */}
          <Route path="/transfer" element={
            <ProtectedRoute
              allowedBackendRoles={["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "ADMIN"]}
              allowedWalletRoles={["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "ADMIN"]}
              requireWallet
              requireCorrectChain
            >
              <TransferProductPage />
            </ProtectedRoute>
          } />
          <Route path="/recall" element={
            <ProtectedRoute
              allowedBackendRoles={["REGULATOR", "ADMIN"]}
              allowedWalletRoles={["REGULATOR", "ADMIN"]}
              requireWallet
              requireCorrectChain
            >
              <RecallPage />
            </ProtectedRoute>
          } />

          {/* ── History / Analytics (any authenticated supply-chain role) ── */}
          <Route path="/history" element={
            <ProtectedRoute
              allowedBackendRoles={["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "ADMIN"]}
              allowedWalletRoles={["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "ADMIN"]}
            >
              <HistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/products/:id" element={
            <ProtectedRoute
              allowedBackendRoles={["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "ADMIN"]}
              allowedWalletRoles={["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "ADMIN"]}
            >
              <ProductDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute
              allowedBackendRoles={["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "ADMIN"]}
            >
              <AnalyticsPage />
            </ProtectedRoute>
          } />

          {/* ── Admin / Audit ── */}
          <Route path="/admin" element={
            <ProtectedRoute
              allowedBackendRoles={["ADMIN"]}
              allowedWalletRoles={["ADMIN"]}
            >
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/audit" element={
            <ProtectedRoute
              allowedBackendRoles={["ADMIN", "REGULATOR"]}
              allowedWalletRoles={["ADMIN", "REGULATOR"]}
            >
              <AuditLogPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </WalletProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ErrorBoundary>
  );
}
