import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  AlertCircle,
  User,
  Stethoscope,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

const DEMO_DOCTORS = [
  { name: 'Dr. Ananya Sharma', email: 'dr.ananya@medichron.demo', role: 'doctor' as UserRole },
  { name: 'Dr. Rahul Mehta', email: 'dr.rahul@medichron.demo', role: 'doctor' as UserRole },
];

const DEMO_PATIENTS = [
  { name: 'Aarav Rao', email: 'aarav@medichron.demo', role: 'patient' as UserRole },
  { name: 'Ananya Iyer', email: 'ananya@medichron.demo', role: 'patient' as UserRole },
  { name: 'Riya Sharma', email: 'riya@medichron.demo', role: 'patient' as UserRole },
  { name: 'Kabir Mehta', email: 'kabir@medichron.demo', role: 'patient' as UserRole },
  { name: 'Sneha Patel', email: 'sneha@medichron.demo', role: 'patient' as UserRole },
];

export const LoginScreen: React.FC = () => {
  const {
    login,
    loginAsDemoPatient,
    loginAsDemoDoctor,
    selectedRole,
    setSelectedRole,
    setScreen,
    dbStatus,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    setErrorMsg(null);
  };

  const handleSelectAccount = (account: { email: string; role: UserRole }) => {
    setSelectedRole(account.role);
    setEmail(account.email);
    setPassword('Medichron@2026');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password, selectedRole);
      if (!res.success) {
        setErrorMsg(res.error || 'Authentication failed. Please check credentials or use Demo Access.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-2xl sm:text-3xl">
              MediChron
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              AI
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight max-w-md mx-auto leading-snug">
            Organize medical records into one clear, explainable timeline.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Select your role to access your personalized medical timeline workspace
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-5">
          {/* ROLE SELECTION CARDS */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Choose your role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Patient Card */}
              <button
                type="button"
                onClick={() => handleRoleChange('patient')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                  selectedRole === 'patient'
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-600/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        selectedRole === 'patient'
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      Patient
                    </span>
                  </div>
                  {selectedRole === 'patient' && (
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  For managing and reviewing your own medical records.
                </p>
              </button>

              {/* Doctor / Clinician Card */}
              <button
                type="button"
                onClick={() => handleRoleChange('doctor')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                  selectedRole === 'doctor'
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-600/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        selectedRole === 'doctor'
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      Doctor / Clinician
                    </span>
                  </div>
                  {selectedRole === 'doctor' && (
                    <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  For reviewing longitudinal patient records.
                </p>
              </button>
            </div>
          </div>

          {/* MongoDB Atlas Database Status */}
          {dbStatus && (
            <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="font-semibold text-slate-700">
                  {dbStatus.connected
                    ? `MongoDB Atlas: Connected ("${dbStatus.database}")`
                    : 'MongoDB: In-Memory Fallback Active'}
                </span>
              </div>
              {dbStatus.counts && (
                <span className="text-slate-500 font-mono text-[10px]">
                  {dbStatus.counts.users} users · {dbStatus.counts.documents} records
                </span>
              )}
            </div>
          )}

          {/* Quick Pre-fill Helper for Seeded MongoDB Evaluation Accounts */}
          <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                <UserCheck className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Seeded MongoDB {selectedRole === 'patient' ? 'Patient' : 'Doctor'} Accounts:</span>
              </div>
              <span className="text-[10px] font-mono text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded border border-teal-200">
                Password: Medichron@2026
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(selectedRole === 'patient' ? DEMO_PATIENTS : DEMO_DOCTORS).map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectAccount(acc)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    email === acc.email
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs font-semibold'
                      : 'bg-white hover:bg-teal-50 text-slate-700 border-slate-200 shadow-2xs'
                  }`}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                {selectedRole === 'patient' ? 'Patient Email' : 'Clinician / Work Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === 'patient'
                      ? 'ananya.rao@example.com'
                      : 'dr.mitchell@hospital.org'
                  }
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white text-slate-900 placeholder:text-slate-400 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white text-slate-900 placeholder:text-slate-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 min-h-[44px]"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>
                    Login as {selectedRole === 'patient' ? 'Patient' : 'Doctor / Clinician'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link to Sign Up */}
          <div className="pt-2 text-center text-xs text-slate-600">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => setScreen('signup')}
              className="font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
            >
              Sign Up
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200" />
            <span className="shrink mx-3 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              or instant demo access
            </span>
            <div className="grow border-t border-slate-200" />
          </div>

          {/* Two Demo Access Buttons */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Continue as Demo Patient */}
              <button
                type="button"
                onClick={loginAsDemoPatient}
                className="w-full py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
              >
                <User className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Continue as Demo Patient</span>
              </button>

              {/* Continue as Demo Doctor */}
              <button
                type="button"
                onClick={loginAsDemoDoctor}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
              >
                <Stethoscope className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Continue as Demo Doctor</span>
              </button>
            </div>
            <p className="text-[11px] text-center text-slate-400">
              The demo buttons work immediately without real authentication (loads synthetic patient data).
            </p>
          </div>
        </div>

        {/* Prototype Healthcare Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
          <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700">Prototype Authentication: </span>
            Designed for hackathon evaluation and verification testing. Organizes factual records without offering medical advice or clinical decisions.
          </div>
        </div>
      </div>
    </div>
  );
};
