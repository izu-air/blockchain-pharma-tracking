import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import RegisterProductPage from "./pages/RegisterProductPage";
import RecallPage from "./pages/RecallPage";
import TransferProductPage from "./pages/TransferProductPage";
import VerifyProductPage from "./pages/VerifyProductPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/register" element={<RegisterProductPage />} />
        <Route path="/transfer" element={<TransferProductPage />} />
        <Route path="/recall" element={<RecallPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/verify" element={<VerifyProductPage />} />
      </Routes>
    </Layout>
  );
}
