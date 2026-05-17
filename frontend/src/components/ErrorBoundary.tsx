import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level safety net for render-time exceptions.  Without this, a crash
 * in any page-level component would unmount the entire React tree and leave
 * the user with a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("Unhandled render error:", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-xl p-6">
          <div className="panel text-center">
            <h1 className="mb-2 text-2xl font-semibold text-red-400">
              Что-то пошло не так
            </h1>
            <p className="mb-4 text-sm text-slate-400">
              {this.state.error.message || "Неизвестная ошибка"}
            </p>
            <button
              type="button"
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500"
              onClick={this.handleReset}
            >
              Попробовать снова
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
