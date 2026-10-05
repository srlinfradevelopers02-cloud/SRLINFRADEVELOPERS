import React, { useState } from 'react';
import { pb } from '../../lib/pocketbase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const authData =
        await pb
          .collection('users')
          .authWithPassword(
            email.trim(),
            password
          );

      /*
       * Confirm PocketBase actually created
       * a valid authenticated session.
       */
      if (
        !pb.authStore.isValid ||
        !authData.record?.id
      ) {
        throw new Error(
          'PocketBase authentication was not established.'
        );
      }

      console.log(
        'PocketBase authentication successful'
      );

      console.log(
        'Authenticated user:',
        authData.record.id
      );

      /*
       * Navigate to CRM.
       */
      window.location.assign('/portal');

    } catch (err: any) {
      console.error(
        'Login failed:',
        err
      );

      /*
       * Clear any incomplete authentication state.
       */
      pb.authStore.clear();

      setError(
        err?.response?.message ||
          err?.message ||
          'Invalid email or password. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">

          <div className="flex justify-center mb-5">
            <img
              src="/logo.png"
              alt="SRL Infra Developers"
              className="h-16 w-auto object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-wide">
            SRL INFRA DEVELOPERS
          </h1>

          <p className="text-[#C5832B] text-xs tracking-[0.3em] uppercase mt-2">
            Operational CRM
          </p>

        </div>

        {/* Login Card */}
        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-8 shadow-2xl">

          <div className="mb-7">
            <h2 className="text-xl font-bold text-white">
              Staff Portal
            </h2>

            <p className="text-sm text-neutral-500 mt-1">
              Sign in to access the internal operations system.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Email Address
              </label>

              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="admin@srlinfra.in"
                disabled={loading}
                className="
                  w-full
                  px-4 py-3
                  bg-[#111111]
                  border border-neutral-700
                  rounded-xl
                  text-white
                  text-sm
                  placeholder-neutral-600
                  focus:outline-none
                  focus:border-[#C5832B]
                  transition-colors
                  disabled:opacity-50
                "
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Password
              </label>

              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                disabled={loading}
                className="
                  w-full
                  px-4 py-3
                  bg-[#111111]
                  border border-neutral-700
                  rounded-xl
                  text-white
                  text-sm
                  placeholder-neutral-600
                  focus:outline-none
                  focus:border-[#C5832B]
                  transition-colors
                  disabled:opacity-50
                "
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3">
                <p className="text-sm text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                py-3.5
                bg-[#C5832B]
                hover:bg-[#D99A43]
                disabled:opacity-50
                disabled:cursor-not-allowed
                text-neutral-950
                font-bold
                text-sm
                uppercase
                tracking-wider
                rounded-xl
                transition-colors
                cursor-pointer
              "
            >
              {loading
                ? 'Signing In...'
                : 'Sign In'}
            </button>

          </form>

          <div className="mt-6 pt-5 border-t border-neutral-800">
            <p className="text-[11px] text-neutral-600 text-center">
              Authorized SRL Infra Developers personnel only.
            </p>
          </div>

        </div>

        {/* Back to Website */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs text-neutral-500 hover:text-[#C5832B] transition-colors"
          >
            ← Back to SRL Website
          </a>
        </div>

      </div>

    </div>
  );
}