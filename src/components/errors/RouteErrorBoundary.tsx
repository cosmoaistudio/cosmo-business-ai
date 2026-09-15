import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { logger } from "@/lib/logger";

type RouteErrorBoundaryProps = {
  children: ReactNode;
  /** Change this when the route changes to clear a previous failure. */
  resetKey?: string;
};

type RouteErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

/**
 * Isolates lazy-route failures so one page cannot take down the whole shell.
 */
export default class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error("Falha ao carregar rota", error, {
      componentStack: info.componentStack,
    });
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (
      this.state.hasError &&
      prevProps.resetKey !== this.props.resetKey &&
      this.props.resetKey !== undefined
    ) {
      this.setState({ hasError: false, message: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <div className="max-w-md rounded-3xl border border-red-200/40 bg-white/5 p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-100">
              Não foi possível abrir esta página
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              {this.state.message ??
                "Ocorreu um erro ao carregar o módulo. Tente novamente."}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() =>
                  this.setState({ hasError: false, message: undefined })
                }
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
              >
                Recarregar página
              </button>
              <Link
                to="/"
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
              >
                Voltar ao Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
