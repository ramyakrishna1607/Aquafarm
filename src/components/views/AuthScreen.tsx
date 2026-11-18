import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { DEMO_USERS } from '../../data/seedData';
import { UserRole } from '../../types/aquafarm';
import { AquaFarmLogo, ModuleLogo } from '../ui/BrandLogos';

export const AuthScreen: React.FC = () => {
  const { login, register } = useFarm();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('ananya.rao@aquafarm.in');
  const [password, setPassword] = useState('aquafarm2026');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [role, setRole] = useState<UserRole>('Farm Manager');
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email address and password.');
      return;
    }
    if (password.trim().length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      register(name, email, role, title);
    } else {
      login(email);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Hero Visual Panel */}
      <div className="lg:w-1/2 relative bg-sky-950 text-white flex flex-col justify-between p-8 lg:p-12 overflow-hidden min-h-[280px]">
        {!imgError && (
          <img
            src="/src/assets/images/aquafarm_aerial_ponds_1795011502213.jpg"
            alt="Aerial view of modern AquaFarm aquaculture ponds"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-sky-950/95 via-sky-950/65 to-sky-950/40" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <AquaFarmLogo size="lg" theme="light" showSubtitle />
        </div>

        <div className="relative z-10 max-w-lg my-8 lg:my-0">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-balance leading-tight">
            Smart Aquaculture Operations in One Centralized Platform
          </h1>
          <p className="text-sm text-sky-100/90 mt-3 leading-relaxed">
            Monitor dissolved oxygen and pH thresholds, detect fish viruses early, track pond capacity and feeding schedules, and manage harvests and ₹ staff payroll with role-based clarity.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-7 pt-6 border-t border-white/15 text-xs">
            <div className="flex items-center gap-2.5">
              <ModuleLogo kind="ponds" size="sm" />
              <div>
                <div className="font-bold tabular-nums text-white">6 Ponds</div>
                <div className="text-[11px] text-sky-200">Max grow capacity</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <ModuleLogo kind="virus" size="sm" />
              <div>
                <div className="font-bold text-white">Virus Scan</div>
                <div className="text-[11px] text-sky-200">Digital biosecurity</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <ModuleLogo kind="feeding" size="sm" />
              <div>
                <div className="font-bold text-white">Feeding</div>
                <div className="text-[11px] text-sky-200">Rations & stock</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <ModuleLogo kind="water" size="sm" />
              <div>
                <div className="font-bold text-white">Water Lab</div>
                <div className="text-[11px] text-sky-200">DO · pH · NH₃</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <ModuleLogo kind="harvest" size="sm" />
              <div>
                <div className="font-bold text-white">Harvests</div>
                <div className="text-[11px] text-sky-200">Yield & buyers</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <ModuleLogo kind="employees" size="sm" />
              <div>
                <div className="font-bold tabular-nums text-white">₹ Payroll</div>
                <div className="text-[11px] text-sky-200">Digital staff ops</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-sky-200/80">
          AquaFarm Operations Suite · Freshwater & Coastal Aquaculture
        </div>
      </div>

      {/* Right Auth Form Panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {mode === 'login' ? 'Sign in to AquaFarm' : 'Create staff account'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {mode === 'login'
                  ? 'Access your pond operations and analytics.'
                  : 'Register a new team member with role permissions.'}
              </p>
            </div>
            <ModuleLogo kind="virus" size="sm" />
          </div>

          <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jordan Rivera"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Access Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-700"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Farm Manager">Farm Manager</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Pond Technician"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-700"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@aquafarm.io"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-700"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
            >
              {mode === 'login' ? 'Sign In to Dashboard' : 'Create Account & Enter'}
            </button>
          </form>

          {/* Instant Role Demo Access */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-3">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Quick Role Access</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">One-click demo sign-in</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => login(u.email, u.role)}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-sky-600 hover:bg-sky-50/50 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-900">{u.role}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{u.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
