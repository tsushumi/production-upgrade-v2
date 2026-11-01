import * as Sentry from '@sentry/react';

function Fallback({ resetError }) {
  return (
    <div className="card error">
      <h2>Something went wrong</h2>
      <p>The error has been reported. Please try again.</p>
      <button onClick={resetError}>Try again</button>
    </div>
  );
}

export default function ErrorBoundary({ children }) {
  return (
    <Sentry.ErrorBoundary fallback={({ resetError }) => <Fallback resetError={resetError} />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
