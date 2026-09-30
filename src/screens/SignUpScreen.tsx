import React, { useState } from 'react';
import {
  Clock,
  Sparkles,
  Lock,
  Mail,
  User,
  Stethoscope,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const SignUpScreen: React.FC = () => {
  const {
    signup,
    loginAsDemoPatient,
    loginAsDemoDoctor,
    selectedRole,
    setSelectedRole,
    setScreen,
  } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(selectedRole || 'patient');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signup(name, email, password, role);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account.');
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

          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Create your MediChron AI account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Synthesize medical records, highlight proof, and review timeline continuity
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-5">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed flex-1">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ROLE SELECTION */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Account Role:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRole('patient');
                    setSelectedRole('patient');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'patient'
                      ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-600/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center ${
                          role === 'patient'
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-slate-900">Patient</span>
                    </div>
                    {role === 'patient' && (
                      <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Review my own care records</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('doctor');
                    setSelectedRole('doctor');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    role === 'doctor'
                      ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-600/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center ${
                          role === 'doctor'
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-slate-900">Doctor</span>
                    </div>
                    {role === 'doctor' && (
                      <CheckCircle2 className="w-4 h-4 text-teal-700" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Review patient care streams</p>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Full Name {role === 'doctor' ? '/ Clinician Title' : ''}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    role === 'doctor' ? 'Dr. Jordan Hayes, MD' : 'Jordan Hayes'
                  }
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white text-slate-900 placeholder:text-slate-400 transition-colors"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Email Address
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
                  placeholder="jordan.hayes@example.org"
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white text-slate-900 placeholder:text-slate-400 transition-colors"
                />
              </div>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 min-h-[44px]"
            >
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>
                    Create {role === 'patient' ? 'Patient' : 'Doctor'} Account
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link back to Login */}
          <div className="pt-2 text-center text-xs text-slate-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setScreen('login')}
              className="font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
            >
              Sign in
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200" />
            <span className="shrink mx-3 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              or demo access
            </span>
            <div className="grow border-t border-slate-200" />
          </div>

          {/* Quick Demo Access */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={loginAsDemoPatient}
              className="w-full py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
            >
              <User className="w-3.5 h-3.5 text-teal-700" />
              <span>Demo Patient</span>
            </button>

            <button
              type="button"
              onClick={loginAsDemoDoctor}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
            >
              <Stethoscope className="w-3.5 h-3.5 text-amber-700" />
              <span>Demo Doctor</span>
            </button>
          </div>
        </div>

        {/* Prototype Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
          <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700">Prototype Notice: </span>
            Designed for evaluation and testing. Only organizes information contained in uploaded records.
          </div>
        </div>
      </div>
    </div>
  );
};
