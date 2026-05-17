import { Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { RoleGuard } from "./components/RoleGuard";
import { WalletProvider } from "./components/WalletContext";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
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

export default function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <Layout>
          <Routes>
            {/* Public routes — anyone can verify a product or log in. */}
            <Route path="/"        element={<DashboardPage />} />
            <Route path="/verify"  element={<VerifyProductPage />} />
            <Route path="/login"   element={<LoginPage />} />

            {/* Role-gated routes. RoleGuard is UX only — real auth lives in
                the smart contract's onlyRole and backend's @PreAuthorize. */}
            <Route path="/manufacturer" element={
              <RoleGuard required={["MANUFACTURER", "ADMIN"]}>
                <ManufacturerDashboardPage />
              </RoleGuard>
            } />
            <Route path="/register" element={
              <RoleGuard required={["MANUFACTURER", "ADMIN"]}>
                <RegisterProductPage />
              </RoleGuard>
            } />
            <Route path="/distributor" element={
              <RoleGuard required={["DISTRIBUTOR", "ADMIN"]}>
                <DistributorDashboardPage />
              </RoleGuard>
            } />
            <Route path="/pharmacy" element={
              <RoleGuard required={["PHARMACY", "ADMIN"]}>
                <PharmacyDashboardPage />
              </RoleGuard>
            } />
            <Route path="/transfer" element={
              <RoleGuard required={["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "ADMIN"]}>
                <TransferProductPage />
              </RoleGuard>
            } />
            <Route path="/recall" element={
              <RoleGuard required={["REGULATOR", "ADMIN"]}>
                <RecallPage />
              </RoleGuard>
            } />
            <Route path="/history" element={
              <RoleGuard required={["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "ADMIN"]}>
                <HistoryPage />
              </RoleGuard>
            } />
            <Route path="/products/:id" element={
              <RoleGuard required={["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "ADMIN"]}>
                <ProductDetailsPage />
              </RoleGuard>
            } />
            <Route path="/analytics" element={
              <RoleGuard required={["MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "ADMIN"]}>
                <AnalyticsPage />
              </RoleGuard>
            } />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </WalletProvider>
    </ErrorBoundary>
  );
}
