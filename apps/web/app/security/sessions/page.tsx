'use client';

import {
  useEffect,
  useState,
} from 'react';

type Session = {
  id: string;
  deviceType: string | null;
  deviceName: string | null;
  browser: string | null;
  operatingSystem: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? '/api';

function getToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    localStorage.getItem('brx_access_token') ??
    localStorage.getItem('accessToken')
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  async function loadSessions() {
    try {
      setLoading(true);
      setError('');

      const token = getToken();

      if (!token) {
        throw new Error('Please login first.');
      }

      const response = await fetch(
        `${API_URL}/sessions`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ?? 'Unable to load sessions',
        );
      }

      setSessions(data.sessions ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load sessions',
      );
    } finally {
      setLoading(false);
    }
  }

  async function logoutSession(sessionId: string) {
    try {
      const token = getToken();

      if (!token) {
        setError('Please login first.');
        return;
      }

      setActionLoading(sessionId);
      setError('');

      const response = await fetch(
        `${API_URL}/sessions/${sessionId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ?? 'Unable to log out this device',
        );
      }

      await loadSessions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to log out this device',
      );
    } finally {
      setActionLoading('');
    }
  }

  async function logoutOthers() {
    try {
      const token = getToken();

      if (!token) {
        setError('Please login first.');
        return;
      }

      setActionLoading('others');
      setError('');

      const response = await fetch(
        `${API_URL}/sessions/logout-all-other`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ??
            'Unable to log out other devices',
        );
      }

      await loadSessions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to log out other devices',
      );
    } finally {
      setActionLoading('');
    }
  }

  async function logoutAll() {
    try {
      const token = getToken();

      if (!token) {
        setError('Please login first.');
        return;
      }

      const confirmed = window.confirm(
        'Log out from all devices? You will also be logged out from this device.',
      );

      if (!confirmed) {
        return;
      }

      setActionLoading('all');
      setError('');

      const response = await fetch(
        `${API_URL}/sessions/logout-all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ??
            'Unable to log out all devices',
        );
      }

      localStorage.removeItem('brx_access_token');
      localStorage.removeItem('accessToken');

      window.location.href = '/login';
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to log out all devices',
      );
      setActionLoading('');
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-sm font-medium text-indigo-400">
              BRX EduNexa Security
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Login Sessions
            </h1>

            <p className="mt-2 text-slate-400">
              Manage devices currently signed in to your account.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={logoutOthers}
              disabled={actionLoading !== ''}
              className="
                rounded-xl
                bg-red-500/10
                px-4
                py-3
                text-sm
                font-semibold
                text-red-300
                ring-1
                ring-red-400/20
                transition
                hover:bg-red-500/20
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {actionLoading === 'others'
                ? 'Logging out...'
                : 'Log out other devices'}
            </button>

            <button
              type="button"
              onClick={logoutAll}
              disabled={actionLoading !== ''}
              className="
                rounded-xl
                border
                border-red-400/20
                px-4
                py-3
                text-sm
                font-semibold
                text-red-300
                transition
                hover:bg-red-500/10
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {actionLoading === 'all'
                ? 'Logging out...'
                : 'Log out all'}
            </button>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="
            mt-8
            rounded-2xl
            border
            border-red-400/20
            bg-red-500/10
            p-5
            text-sm
            text-red-300
          ">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="
            mt-8
            rounded-2xl
            border
            border-white/10
            bg-white/5
            p-6
            text-slate-400
          ">
            Loading login sessions...
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          sessions.length === 0 && (
            <div className="
              mt-8
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-6
              text-slate-400
            ">
              No active login sessions found.
            </div>
          )}

        {/* Sessions */}
        <div className="mt-8 space-y-4">

          {sessions.map((session) => (
            <div
              key={session.id}
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/5
                p-6
                shadow-xl
                shadow-black/10
              "
            >

              <div className="
                flex
                flex-col
                gap-5
                md:flex-row
                md:items-center
                md:justify-between
              ">

                <div className="flex items-start gap-4">

                  {/* Device icon */}
                  <div className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-indigo-500/10
                    text-2xl
                  ">
                    {session.deviceType === 'Mobile'
                      ? '📱'
                      : session.deviceType === 'Tablet'
                        ? '📲'
                        : '💻'}
                  </div>

                  {/* Device details */}
                  <div>

                    <div className="
                      flex
                      flex-wrap
                      items-center
                      gap-2
                    ">

                      <h2 className="font-semibold">
                        {session.deviceName ??
                          'Unknown device'}
                      </h2>

                      {session.isCurrent && (
                        <span className="
                          rounded-full
                          bg-emerald-500/10
                          px-2.5
                          py-1
                          text-xs
                          font-semibold
                          text-emerald-300
                          ring-1
                          ring-emerald-400/20
                        ">
                          Current device
                        </span>
                      )}

                    </div>

                    <p className="
                      mt-1
                      text-sm
                      text-slate-400
                    ">
                      {session.browser ??
                        'Unknown browser'}
                      {' · '}
                      {session.operatingSystem ??
                        'Unknown OS'}
                    </p>

                    <div className="
                      mt-3
                      space-y-1
                      text-xs
                      text-slate-500
                    ">
                      <p>
                        Last active:{' '}
                        {new Date(
                          session.lastActiveAt,
                        ).toLocaleString()}
                      </p>

                      {session.ipAddress && (
                        <p>
                          IP address:{' '}
                          {session.ipAddress}
                        </p>
                      )}
                    </div>

                  </div>
                </div>

                {/* Logout individual */}
                {!session.isCurrent && (
                  <button
                    type="button"
                    onClick={() =>
                      logoutSession(session.id)
                    }
                    disabled={actionLoading !== ''}
                    className="
                      rounded-xl
                      border
                      border-white/10
                      px-4
                      py-2.5
                      text-sm
                      font-medium
                      text-slate-300
                      transition
                      hover:bg-white/10
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {actionLoading === session.id
                      ? 'Logging out...'
                      : 'Log out'}
                  </button>
                )}

              </div>
            </div>
          ))}

        </div>
      </div>
    </main>
  );
}