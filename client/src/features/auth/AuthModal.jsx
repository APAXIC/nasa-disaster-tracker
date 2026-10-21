import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, LockClosedIcon, EnvelopeIcon, UserIcon } from '@heroicons/react/24/outline';
import { loginUser, registerUser } from './api.js';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = isLogin
        ? await loginUser(email, password)
        : await registerUser(name, email, password);
      onAuthSuccess(result.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (login) => {
    setIsLogin(login);
    setError('');
  };

  const fieldClass = 'w-full min-w-0 h-12 pl-12 pr-4 rounded-xl border border-slate-600/60 bg-slate-800/70 text-slate-100 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20';
  const iconClass = 'auth-modal-field-icon';

  return createPortal(
    <div
      className="auth-modal-overlay fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm"
      style={{ position: 'fixed', inset: 0, zIndex: 2147483000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto', backgroundColor: 'rgba(3, 10, 22, 0.78)' }}
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        className="auth-modal-dialog relative w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900 text-slate-100 shadow-2xl"
        style={{ position: 'relative', width: '100%', maxWidth: '448px', flexShrink: 0, margin: 'auto', boxSizing: 'border-box', padding: '28px', borderRadius: '18px' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <header className="auth-modal-header flex items-start justify-between gap-4 mb-6">
          <div className="auth-modal-heading min-w-0">
            <span className="auth-modal-eyebrow block mb-2 text-[11px] font-bold tracking-[0.18em] text-blue-400">EONET TRACKER</span>
            <h2 id="auth-modal-title" className="text-xl font-bold leading-tight text-slate-100">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{isLogin ? 'Sign in to manage your watch zones and alerts.' : 'Create an account to save zones and receive alerts.'}</p>
          </div>
          <button type="button" className="auth-modal-close flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white" onClick={onClose} aria-label="Close authentication dialog">
            <XMarkIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        <div className="auth-modal-tabs grid grid-cols-2 gap-1 rounded-xl border border-slate-700 bg-slate-800/70 p-1 mb-6" role="tablist" aria-label="Authentication mode">
          <button type="button" role="tab" aria-selected={isLogin} className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition ${isLogin ? 'is-active bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`} onClick={() => switchMode(true)}>Sign In</button>
          <button type="button" role="tab" aria-selected={!isLogin} className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition ${!isLogin ? 'is-active bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`} onClick={() => switchMode(false)}>Register</button>
        </div>

        {error && <div className="auth-modal-error mb-5 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-300" role="alert">{error}</div>}

        <form className="auth-modal-form flex flex-col gap-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="auth-modal-field flex flex-col gap-2">
              <label htmlFor="auth-name" className="text-sm font-semibold text-slate-300">Full Name</label>
              <div className="auth-modal-input-wrap relative">
                <UserIcon className={iconClass} aria-hidden="true" />
                <input className={fieldClass} id="auth-name" type="text" autoComplete="name" required placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
          )}
          <div className="auth-modal-field flex flex-col gap-2">
            <label htmlFor="auth-email" className="text-sm font-semibold text-slate-300">Email Address</label>
            <div className="auth-modal-input-wrap relative">
              <EnvelopeIcon className={iconClass} aria-hidden="true" />
              <input className={fieldClass} id="auth-email" type="email" autoComplete="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="auth-modal-field flex flex-col gap-2">
            <label htmlFor="auth-password" className="text-sm font-semibold text-slate-300">Password</label>
            <div className="auth-modal-input-wrap relative">
              <LockClosedIcon className={iconClass} aria-hidden="true" />
              <input className={fieldClass} id="auth-password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength={6} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <button className="auth-modal-submit mt-1 min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50" type="submit" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </section>
    </div>,
    document.body
  );
}
