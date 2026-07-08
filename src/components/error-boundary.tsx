import { Component, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-6">
          <span className="text-3xl">⚠️</span>
          <p className="text-center font-mono text-sm text-red-400">
            Etwas ist schiefgelaufen. Bitte Seite neu laden.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
