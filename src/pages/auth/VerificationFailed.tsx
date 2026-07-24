import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { ROUTES } from '../../constants';

export default function VerificationFailed() {
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
          className="status-icon-wrap status-icon-wrap--error"
        >
          <AlertCircle className="w-14 h-14 text-rose-500" />
        </motion.div>

        {/* Copy */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="auth-title">Verification Failed</h1>
          <p className="auth-subtitle max-w-[320px] mx-auto mt-2">
            We couldn't verify your medical registration ID. Please ensure the
            document is clear and matches your details.
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
            onClick={() => navigate(ROUTES.VERIFY_ID)}
            className="auth-btn-primary"
          >
            <RefreshCcw className="w-5 h-5" />
            Try Again
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(ROUTES.GET_STARTED)}
            className="auth-btn-outline"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
