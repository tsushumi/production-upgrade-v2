import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

// Temporary: set VITE_ENABLE_SENTRY_TEST=true to show a button that crashes the
// component tree, so you can confirm the error reaches Sentry. Remove afterwards.
function Bomb() {
  throw new Error('Sentry frontend test error');
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [crash, setCrash] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`Health check failed (${res.status})`);
        return res.json();
      })
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  if (crash) return <Bomb />;

  return (
    <main className="card">
      <h1>PayLink</h1>
      <p>Production-ready: CI/CD, tests, Sentry, UptimeRobot, Pino, staging.</p>

      <h2>API status</h2>
      {health && (
        <p className="ok">
          API is {health.status} ({health.environment}), up {health.uptime}s
        </p>
      )}
      {error && <p className="bad">{error}</p>}
      {!health && !error && <p>Checking...</p>}

      {import.meta.env.VITE_ENABLE_SENTRY_TEST === 'true' && (
        <button onClick={() => setCrash(true)}>Trigger test error</button>
      )}
    </main>
  );
}
