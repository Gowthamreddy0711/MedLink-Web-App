import { motion } from 'motion/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import { ROUTES } from '../../constants';

export default function SplashScreen() {
  // ── Business logic unchanged ──────────────────────────────────────────────
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(ROUTES.GET_STARTED);
    }, 1000);
    return () => clearTimeout(timer);
  }, [navigate]);
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="splash-bg">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <Logo size="xl" />
      </motion.div>

      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="splash-tagline"
      >
        Smart Doctor Network
      </motion.p>

      {/* Subtle loading bar */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.65, ease: 'easeInOut' }}
        className="splash-bar"
      />
    </div>
  );
}
