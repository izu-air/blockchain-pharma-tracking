import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultMessage } from "./ResultMessage";

describe("ResultMessage", () => {
  it("renders transaction hash", () => {
    render(<ResultMessage txHash="0xabc" />);
    expect(screen.getByText(/Транзакция отправлена/i)).toBeInTheDocument();
    expect(screen.getByText("0xabc")).toBeInTheDocument();
  });

  it("renders error message", () => {
    render(<ResultMessage error="Ошибка MetaMask" />);
    expect(screen.getByText("Ошибка MetaMask")).toBeInTheDocument();
  });
});
