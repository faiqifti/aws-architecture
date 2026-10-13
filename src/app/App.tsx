import { Component, type ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ProgressProvider } from '@/hooks/useProgress';
import { router } from './routes';

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">Your saved progress is safe. Reload the page to continue.</p>
        <button type="button" className="btn-primary mt-4" onClick={() => location.reload()}>Reload</button>
      </div>
    );
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ProgressProvider>
        <RouterProvider router={router} />
      </ProgressProvider>
    </ErrorBoundary>
  );
}
