import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Clock, Users } from 'lucide-react';
import { ROUTES } from '../../constants';
import Logo from '../../components/Logo';

export default function GetStartedScreen() {
  // ── Business logic unchanged ──────────────────────────────────────────────
  const navigate = useNavigate();
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="auth-page-bg">
      <div className="auth-page-shell auth-page-shell--centered">

        {/* Logo */}
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex justify-center"
        >
          <Logo size="lg" />
        </motion.div>

        {/* Hero copy */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="gs-headline">
            Healthcare connections<br className="hidden sm:block" /> made simple.
          </h1>
          <p className="gs-subline">
            Connect with top doctors, manage prescriptions and never miss a dose
            with our smart reminder system.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="gs-features"
        >
          <span className="gs-feature-pill">
            <ShieldCheck className="w-3.5 h-3.5" />
            HIPAA Secure
          </span>
          <span className="gs-feature-pill">
            <Clock className="w-3.5 h-3.5" />
            24/7 Access
          </span>
          <span className="gs-feature-pill">
            <Users className="w-3.5 h-3.5" />
            10k+ Doctors
          </span>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(ROUTES.ROLE_SELECTION)}
          className="auth-btn-primary"
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        <p className="auth-footer-note">
          Free to sign up · No credit card required
        </p>
      </div>
    </div>
  );
}
