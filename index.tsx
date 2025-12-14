import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  public state = { hasError: false, error: null as Error | null };

  constructor(props: {children: React.ReactNode}) {
    super(props);
    // State initialization is handled by the class property above
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          height: '100vh', backgroundColor: '#000', color: '#d4af37', fontFamily: 'sans-serif', textAlign: 'center', padding: '20px'
        }}>
          <h1 style={{fontSize: '24px', marginBottom: '10px'}}>Something went wrong</h1>
          <p style={{color: '#666', fontSize: '14px', maxWidth: '600px'}}>
            {this.state.error?.message || "Unknown Application Error"}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{marginTop: '20px', padding: '10px 20px', background: '#d4af37', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);