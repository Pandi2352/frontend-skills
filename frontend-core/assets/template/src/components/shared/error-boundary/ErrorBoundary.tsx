import { Component, type ErrorInfo, type ReactNode } from 'react';
import { isChunkError } from '@/lib/lazy';
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
  missingFile: boolean;
  resetKey: string | undefined;
}

/** Use around the app, each route, and risky widgets. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  override state: State = { failed: false, missingFile: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { failed: true, missingFile: isChunkError(error) };
  }
  static getDerivedStateFromProps(props: ErrorBoundaryProps, state: State): Partial<State> | null {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey };
  }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }
  reset = () => {
    // React remembers a failed download, so only a reload can get the file.
    if (this.state.missingFile) window.location.reload();
    else this.setState({ failed: false });
  };

  override render() {
    if (!this.state.failed) return this.props.children;
    return this.props.fallback ? this.props.fallback(this.reset) : <ErrorState onRetry={this.reset} />;
  }
}
