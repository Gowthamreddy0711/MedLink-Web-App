import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { User, Activity } from 'lucide-react';
import { ROUTES } from '../../constants';
import { UserRole } from '../../types';

export default function RoleSelectionScreen() {
  const navigate = useNavigate();

  // ── Business logic unchanged ──────────────────────────────────────────────
  const handleRoleSelect = (role: UserRole) => {
    navigate(ROUTES.LOGIN, { state: { role } });
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="auth-page-bg">
      {/* ── Centered page shell ── */}
      <div className="auth-page-shell">

        {/* Header badge */}
        <div className="auth-brand-badge">
          <span className="auth-brand-text">MedLink</span>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">Choose Your Role</h1>
            <p className="auth-subtitle">How would you like to use MedLink today?</p>
          </div>

          {/* Role cards grid */}
          <div className="role-grid">
            <RoleCard
              icon={<Activity className="w-7 h-7 text-blue-600" />}
              title="Doctor"
              description="Manage your clinic, patients and coverage requests seamlessly."
              onClick={() => handleRoleSelect(UserRole.DOCTOR)}
              accent="blue"
            />
            <RoleCard
              icon={<User className="w-7 h-7 text-teal-600" />}
              title="Patient"
              description="Book appointments, get reminders and track your health."
              onClick={() => handleRoleSelect(UserRole.PATIENT)}
              accent="teal"
            />
          </div>
        </div>

        <p className="auth-footer-note">
          Secure medical-grade encryption on all connections
        </p>
      </div>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  description,
  onClick,
  accent,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  accent: 'blue' | 'teal';
}) {
  const accentClasses =
    accent === 'blue'
      ? 'bg-blue-50 border-blue-100 hover:border-blue-400 hover:shadow-blue-100'
      : 'bg-teal-50 border-teal-100 hover:border-teal-400 hover:shadow-teal-100';

  const iconBg =
    accent === 'blue' ? 'bg-blue-100' : 'bg-teal-100';

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      className={`role-card ${accentClasses}`}
    >
      <div className={`role-card-icon ${iconBg}`}>{icon}</div>
      <h3 className="role-card-title">{title}</h3>
      <p className="role-card-desc">{description}</p>
    </motion.button>
  );
}
