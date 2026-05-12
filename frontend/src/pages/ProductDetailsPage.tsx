import { useParams } from "react-router-dom";
import HistoryPage from "./HistoryPage";

export default function ProductDetailsPage() {
  const { id } = useParams();
  return <HistoryPage initialProductId={id ?? "1"} />;
}
