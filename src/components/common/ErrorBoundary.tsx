import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('N-Lab Uncaught Error:', error, errorInfo);
  }

  private handleRestart = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleResetState = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid var(--accent-error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: 'var(--accent-error)',
            }}
          >
            <AlertTriangle size={32} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
            Something Went Wrong
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', marginBottom: '20px' }}>
            {this.state.error?.message || 'N-Lab encountered an unexpected error. Don\'t worry, your app is safe and ready to recover.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '320px' }}>
            <button
              onClick={this.handleResetState}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <RefreshCw size={16} />
              <span>Retry</span>
            </button>

            <button
              onClick={this.handleRestart}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Home size={16} />
              <span>Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
