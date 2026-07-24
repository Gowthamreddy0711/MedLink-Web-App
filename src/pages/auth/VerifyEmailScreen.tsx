import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, Info } from 'lucide-react';
import { ROUTES } from '../../constants';
import { auth, db as firestoreDb } from '../../services/firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

interface VerifyEmailScreenProps {
  user: any;
  setUser: (user: any) => void;
  showAccountExistsToast?: boolean;
}

export default function VerifyEmailScreen({
  user,
  setUser,
  showAccountExistsToast = false,
}: VerifyEmailScreenProps) {
  const navigate = useNavigate();

  // ── Business logic state (unchanged) ─────────────────────────────────────
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [showToast, setShowToast] = useState(showAccountExistsToast);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
        if (user && user.accountExisted) {
          const updated = { ...user, accountExisted: false };
          localStorage.setItem('medlink_user', JSON.stringify(updated));
          setUser(updated);
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast, user, setUser]);

  const handleBackToSignup = async () => {
    try { await signOut(auth); } catch (e) { console.error(e); }
    localStorage.removeItem('medlink_user');
    setUser(null);
    navigate(ROUTES.SIGNUP);
  };

  const handleResendEmail = async () => {
    if (user?.isEmailProviderDisabled) {
      setMessage({ type: 'info', text: 'Firebase Email/Password is currently operating in Developer fallback. Verification is auto-simulated.' });
      return;
    }
    setIsResending(true);
    setMessage(null);
    try {
      const fbUser = auth.currentUser;
      if (fbUser) {
        await sendEmailVerification(fbUser);
        setMessage({ type: 'success', text: 'Verification email resent successfully! Please check your spam folder too.' });
      } else {
        throw new Error('No authenticate session found. Please try logging in again.');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to resend email. Please try again shortly.' });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    setMessage(null);
    if (user?.isEmailProviderDisabled) {
      setTimeout(async () => {
        setIsChecking(false);
        const updatedUser = { ...user, emailVerified: true };
        localStorage.setItem('medlink_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        if (updatedUser.role === 'doctor') { navigate(ROUTES.VERIFY_ID); }
        else { navigate(ROUTES.PATIENT_HOME); }
      }, 100);
      return;
    }
    setTimeout(async () => {
      try {
        const fbUser = auth.currentUser;
        if (fbUser) {
          try { await fbUser.reload(); } catch (reloadErr) { console.warn('[AUTH] Reload ignored for demo verification:', reloadErr); }
          const updatedUser = { ...user, emailVerified: true };
          if (fbUser.uid) {
            const userRef = doc(firestoreDb, 'users', fbUser.uid);
            updateDoc(userRef, { emailVerified: true }).catch(fsErr => { console.warn('[FIRESTORE] Failed to flag emailVerified in background:', fsErr); });
          }
          localStorage.setItem('medlink_user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          if (updatedUser.role === 'doctor') { navigate(ROUTES.VERIFY_ID); }
          else { navigate(ROUTES.PATIENT_HOME); }
        } else {
          const mockUser = { ...user, emailVerified: true };
          localStorage.setItem('medlink_user', JSON.stringify(mockUser));
          setUser(mockUser);
          if (mockUser.role === 'doctor') { navigate(ROUTES.VERIFY_ID); }
          else { navigate(ROUTES.PATIENT_HOME); }
        }
      } catch (err: any) {
        console.error('Bypass verification error:', err);
        const mockUser = { ...user, emailVerified: true };
        localStorage.setItem('medlink_user', JSON.stringify(mockUser));
        setUser(mockUser);
        if (mockUser.role === 'doctor') { navigate(ROUTES.VERIFY_ID); }
        else { navigate(ROUTES.PATIENT_HOME); }
      } finally {
        setIsChecking(false);
      }
    }, 150);
  };
  // ─────────────────────────────────────────────────────────────────────────

  const isDoctor = user?.role === 'doctor';
  const stepsText = isDoctor ? 'Step 2 of 3' : 'Step 2 of 2';

  return (
    <div className="auth-page-bg">
      <div className="auth-page-shell">

        {/* Top bar */}
        <div className="auth-topbar">
          <button onClick={handleBackToSignup} className="auth-back-btn" aria-label="Back to signup">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="auth-topbar-label">{stepsText}</span>
        </div>

        {/* Card */}
        <div className="auth-card">
          {/* Icon */}
          <div className="auth-icon-wrap auth-icon-blue">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>

          <div className="auth-card-header">
            <h1 className="auth-title">Verify Your Email</h1>
            <p className="auth-subtitle">
              We sent a verification link to
            </p>
            <p className="text-blue-600 font-semibold text-sm mt-1 break-all">
              {user?.email || ''}
            </p>
          </div>

          <div className="auth-form">
            {/* Primary CTA */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckVerification}
              disabled={isChecking}
              className="auth-btn-primary"
            >
              {isChecking ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Checking…</span></>
              ) : (
                'I Verified My Email'
              )}
            </motion.button>

            {/* Resend */}
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={isResending}
              className="auth-btn-ghost"
            >
              {isResending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Resending…</span></>
              ) : (
                'Resend Verification Email'
              )}
            </button>

            {/* Demo bypass — visually subtle */}
            <button
              type="button"
              onClick={async () => {
                setIsChecking(true);
                const updatedUser = { ...user, emailVerified: true };
                localStorage.setItem('medlink_user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                if (updatedUser.role === 'doctor') { navigate(ROUTES.VERIFY_ID); }
                else { navigate(ROUTES.PATIENT_HOME); }
                setIsChecking(false);
              }}
              className="text-xs text-slate-400 hover:text-blue-500 font-medium text-center transition-colors"
            >
              Auto-Verify (Demo Bypass)
            </button>

            {/* Feedback message */}
            {message && (
              <div
                className={`auth-message ${
                  message.type === 'success'
                    ? 'auth-message--success'
                    : message.type === 'info'
                    ? 'auth-message--info'
                    : 'auth-message--error'
                }`}
              >
                <Info className="w-4 h-4 shrink-0" />
                <p className="text-xs leading-relaxed">{message.text}</p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-2">
            Can't find it? Check your spam folder.
          </p>
        </div>
      </div>

      {/* Account-exists toast — position/animation logic unchanged */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className="bg-[#22252a] text-white px-5 py-3.5 rounded-3xl flex items-center gap-3 shadow-2xl border border-slate-700/20">
              <div className="w-6 h-6 bg-blue-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center shrink-0">
                M
              </div>
              <p className="text-xs font-semibold text-slate-100 leading-snug">
                Account exists. Redirecting to verification…
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
