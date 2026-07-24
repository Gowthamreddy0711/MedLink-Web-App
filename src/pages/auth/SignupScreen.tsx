import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, Loader2, Hospital, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { ROUTES } from '../../constants';
import { UserRole } from '../../types';
import { db } from '../../services/db';

interface SignupScreenProps {
  setUser: (user: any) => void;
}

export default function SignupScreen({ setUser }: SignupScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Business logic state (unchanged) ─────────────────────────────────────
  const role = (location.state?.role as UserRole) || UserRole.PATIENT;
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicLocation, setClinicLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');
    try {
      const newUser = {
        name,
        email,
        phone,
        password,
        role,
        clinicName: role === UserRole.DOCTOR ? clinicName : undefined,
        clinicLocation: role === UserRole.DOCTOR ? clinicLocation : undefined,
        photoUrl:
          role === UserRole.DOCTOR
            ? 'https://images.unsplash.com/photo-1559839734-2b71f153678e?auto=format&fit=crop&q=80&w=200&h=200'
            : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200&h=200',
      };
      const savedUser = await db.signup(newUser);
      setUser(savedUser);
      localStorage.setItem('medlink_user', JSON.stringify(savedUser));
      if (role === UserRole.DOCTOR) {
        navigate(ROUTES.VERIFY_ID);
      } else {
        navigate(ROUTES.PATIENT_HOME);
      }
    } catch (err: any) {
      setIsLoading(false);
      setFormError(err.message);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="auth-page-bg">
      <div className="auth-page-shell">

        {/* Back / label */}
        <div className="auth-topbar">
          <button
            onClick={() => navigate(ROUTES.LOGIN, { state: { role } })}
            className="auth-back-btn"
            aria-label="Back to login"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="auth-topbar-label">Create Account</span>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">
              Join as a{' '}
              <span className="text-blue-600 font-semibold capitalize">{role}</span>
            </p>
          </div>

          <form onSubmit={handleSignup} className="auth-form">
            {/* Full Name */}
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrap">
                <User className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="John Doe"
                  className="auth-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <div className="auth-input-wrap">
                <Mail className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="example@medlink.com"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="auth-field">
              <label className="auth-label">Phone</label>
              <div className="auth-input-wrap">
                <Phone className="auth-input-icon" />
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="auth-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Doctor-only fields */}
            {role === UserRole.DOCTOR && (
              <>
                <div className="auth-field">
                  <label className="auth-label">Clinic Name</label>
                  <div className="auth-input-wrap">
                    <Hospital className="auth-input-icon" />
                    <input
                      type="text"
                      placeholder="City General Hospital"
                      className="auth-input"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Clinic Location</label>
                  <div className="auth-input-wrap">
                    <MapPin className="auth-input-icon" />
                    <input
                      type="text"
                      placeholder="123 Medical Drive, New York"
                      className="auth-input"
                      value={clinicLocation}
                      onChange={(e) => setClinicLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <Lock className="auth-input-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Privacy notice */}
            <div className="auth-notice">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                By continuing, you agree to our{' '}
                <button type="button" className="underline hover:text-blue-900 font-semibold">
                  Healthcare Privacy Standards
                </button>
                .
              </p>
            </div>

            {formError && <div className="auth-error">{formError}</div>}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              type="submit"
              className="auth-btn-primary"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </motion.button>
          </form>

          <div className="auth-divider">
            <span className="auth-divider-text">Already have an account?</span>
            <button
              onClick={() => navigate(ROUTES.LOGIN, { state: { role } })}
              className="auth-switch-btn"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
