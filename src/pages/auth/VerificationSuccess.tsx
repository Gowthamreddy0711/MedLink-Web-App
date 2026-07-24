import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../constants';

export default function VerificationSuccess() {
  // ── Business logic unchanged ──────────────────────────────────────────────
  const navigate = useNavigate();
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="auth-page-bg">
      <div className="auth-page-shell auth-page-shell--centered">

        {/* Status icon */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 120 }}
          className="status-icon-wrap status-icon-wrap--success"
        >
          <CheckCircle2 className="w-14 h-14 text-emerald-500" />
        </motion.div>

        {/* Copy */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="auth-title">Documents Submitted!</h1>
          <p className="auth-subtitle max-w-[320px] mx-auto mt-2">
            Our team is now auditing your credentials. You will be notified via
            email once approved.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="w-full flex flex-col gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(ROUTES.DOCTOR_DASHBOARD)}
            className="auth-btn-primary"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          <p className="text-center text-xs text-slate-400 font-medium uppercase tracking-wider">
            Limited access available until fully verified
          </p>
        </motion.div>
      </div>
    </div>
  );
}
