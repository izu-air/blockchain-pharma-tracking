import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import DistributorDashboardPage from "./pages/DistributorDashboardPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import ManufacturerDashboardPage from "./pages/ManufacturerDashboardPage";
import PharmacyDashboardPage from "./pages/PharmacyDashboardPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import RegisterProductPage from "./pages/RegisterProductPage";
import RecallPage from "./pages/RecallPage";
import TransferProductPage from "./pages/TransferProductPage";
import VerifyProductPage from "./pages/VerifyProductPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/manufacturer" element={<ManufacturerDashboardPage />} />
        <Route path="/distributor" element={<DistributorDashboardPage />} />
        <Route path="/pharmacy" element={<PharmacyDashboardPage />} />
        <Route path="/register" element={<RegisterProductPage />} />
        <Route path="/transfer" element={<TransferProductPage />} />
        <Route path="/recall" element={<RecallPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/verify" element={<VerifyProductPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </Layout>
  );
}
