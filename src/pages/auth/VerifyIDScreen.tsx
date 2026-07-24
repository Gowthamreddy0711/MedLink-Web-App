import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';

export default function VerifyIDScreen() {
  const navigate = useNavigate();

  // ── Business logic state (unchanged) ─────────────────────────────────────
  const [isUploading, setIsUploading] = useState(false);
  const [medicalId, setMedicalId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      navigate(ROUTES.VERIFICATION_SUCCESS);
    }, 150);
  };
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="auth-page-bg">
      <div className="auth-page-shell">

        {/* Top bar */}
        <div className="auth-topbar">
          <button onClick={() => navigate(-1)} className="auth-back-btn" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="auth-topbar-label">Step 2 of 2</span>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">Identity Verification</h1>
            <p className="auth-subtitle">
              To ensure patient safety, we need to verify your medical credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Medical Registration ID */}
            <div className="auth-field">
              <label className="auth-label">Medical Registration ID</label>
              <div className="auth-input-wrap">
                <FileText className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="REG-12345-MED"
                  className="auth-input uppercase"
                  value={medicalId}
                  onChange={(e) => setMedicalId(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* File upload */}
            <div className="auth-field">
              <label className="auth-label">Practice License Document</label>
              <div
                className={cn(
                  'upload-zone',
                  file ? 'upload-zone--uploaded' : 'upload-zone--empty',
                )}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-full">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 text-center break-all max-w-[240px]">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-blue-900 text-center">
                      Upload License Copy
                    </p>
                    <p className="text-xs text-slate-400">PDF / JPG / PNG · Max 5 MB</p>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                  </>
                )}
              </div>
            </div>

            {/* Security note */}
            <div className="auth-notice">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-900 mb-0.5">Secure Verification</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Your documents are encrypted and only accessible by our medical vetting team.
                  Verification usually takes 2–4 hours.
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isUploading || !file || !medicalId}
              className="auth-btn-primary"
            >
              {isUploading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Verifying…</span></>
              ) : (
                'Submit for Approval'
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
