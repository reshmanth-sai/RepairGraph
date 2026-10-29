'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, KeyRound, Smartphone, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function MfaPortalPage() {
  const [secret, setSecret] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  const handleGenerateSecret = async () => {
    setLoading(true);
    setStatus({ type: 'idle', message: '' });
    try {
      const res = await fetch('/api/auth/mfa/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSecret(data.data.secret);
        setQrUrl(data.data.qrCodeDataUrl);
      } else {
        // If not logged in, generate local demo secret for verification showcase
        const demoSecret = 'JBSWY3DPEHPK3PXP';
        setSecret(demoSecret);
        setStatus({
          type: 'error',
          message: data.error?.message || 'Login session required. Showing demo setup below.',
        });
      }
    } catch {
      setStatus({ type: 'error', message: 'Failed to generate TOTP secret.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setStatus({ type: 'error', message: 'Please enter a valid 6-digit authenticator code.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, secret }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus({
          type: 'success',
          message: 'TOTP Authentication Verified Successfully! Session upgraded to MFA-Protected.',
        });
      } else {
        setStatus({
          type: 'error',
          message: data.error?.message || 'Invalid TOTP code. Codes rotate every 30 seconds.',
        });
      }
    } catch {
      setStatus({ type: 'error', message: 'Verification request failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-lg bg-stone-800/90 border border-stone-700 rounded-xl p-8 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/overview"
            className="flex items-center text-sm text-stone-400 hover:text-stone-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-mono">
            <Shield className="w-3.5 h-3.5" /> RFC 6238 TOTP
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-600/10 border border-orange-500/30 text-orange-400 mb-4 shadow-inner">
            <Smartphone className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-100">
            Multi-Factor Authentication
          </h1>
          <p className="text-sm text-stone-400 mt-2">
            Secure your RepairGraph account with Google Authenticator or Microsoft Authenticator.
          </p>
        </div>

        {!secret ? (
          <div className="text-center py-6">
            <button
              onClick={handleGenerateSecret}
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? 'Generating Security Key...' : 'Setup Authenticator App'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {qrUrl && (
              <div className="flex flex-col items-center p-4 bg-stone-900 rounded-xl border border-stone-700">
                <p className="text-xs text-stone-400 font-mono mb-3">
                  Step 1: Scan with Google or Microsoft Authenticator
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="MFA QR Code"
                  className="w-48 h-48 rounded-lg bg-white p-2 shadow-md"
                />
                <div className="mt-3 text-center">
                  <span className="text-xs text-stone-400">Manual Setup Secret:</span>
                  <div className="font-mono text-sm font-bold text-orange-400 tracking-wider select-all mt-0.5">
                    {secret}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-stone-300 uppercase tracking-wider mb-2">
                  Step 2: Enter 6-Digit Rotating Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-lg text-center font-mono text-2xl tracking-[0.5em] text-orange-400 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'Verifying Code...' : 'Verify & Enable MFA'}
              </button>
            </form>

            {status.type !== 'idle' && (
              <div
                className={`p-3.5 rounded-lg border flex items-start gap-3 text-sm ${
                  status.type === 'success'
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-800 text-rose-300'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                )}
                <span>{status.message}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-stone-700/60 text-center">
          <p className="text-xs text-stone-500">
            Compliant with RFC 6238 Standard • SHA-1 30-Second Dynamic Window
          </p>
        </div>
      </div>
    </div>
  );
}
