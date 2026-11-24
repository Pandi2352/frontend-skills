import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '../states';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (reset: () => void) => ReactNode;
  /** Send to your error service. */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Resets when this changes, e.g. the current path. */
  resetKey?: string;
}

interface State {
  failed: boolean;
  resetKey: string | undefined;
}

/** Use around the app, each route, and risky widgets. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  override state: State = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }
  static getDerivedStateFromProps(props: ErrorBoundaryProps, state: State): Partial<State> | null {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey };
  }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }
  reset = () => this.setState({ failed: false });

  override render() {
    if (!this.state.failed) return this.props.children;
    return this.props.fallback ? this.props.fallback(this.reset) : <ErrorState onRetry={this.reset} />;
  }
}
