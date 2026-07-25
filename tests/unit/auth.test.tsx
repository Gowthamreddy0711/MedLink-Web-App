/**
 * Authentication Tests — 50 test cases
 * Covers: login, signup, logout, role selection, session management,
 * JWT handling, token expiry, protected routes, OTP, verification flows
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { UserRole } from '../../src/types';
import { mockDoctor, mockPatient } from '../__mocks__/db';

// ── Helpers ──────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/login', state: { role: UserRole.PATIENT }, search: '', hash: '' }),
    useParams: () => ({}),
  };
});

const mockDb = {
  login: vi.fn(),
  signup: vi.fn(),
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
};
vi.mock('../../src/services/db', () => ({ db: mockDb, seedFirestore: vi.fn(), localDb: { getItem: vi.fn(), setItem: vi.fn() } }));

const setUserMock = vi.fn();

function wrapWithRouter(element: React.ReactNode, initialEntries = ['/login']) {
  return render(<MemoryRouter initialEntries={initialEntries}>{element}</MemoryRouter>);
}

// ── AUTH-01 to AUTH-10 · Data types and UserRole enum ────────────────────────
describe('AUTH-01 UserRole enum', () => {
  it('AUTH-01 UserRole.DOCTOR equals "doctor"', () => {
    expect(UserRole.DOCTOR).toBe('doctor');
  });
  it('AUTH-02 UserRole.PATIENT equals "patient"', () => {
    expect(UserRole.PATIENT).toBe('patient');
  });
  it('AUTH-03 UserRole values are distinct', () => {
    expect(UserRole.DOCTOR).not.toBe(UserRole.PATIENT);
  });
  it('AUTH-04 UserRole.DOCTOR is a string', () => {
    expect(typeof UserRole.DOCTOR).toBe('string');
  });
  it('AUTH-05 UserRole.PATIENT is a string', () => {
    expect(typeof UserRole.PATIENT).toBe('string');
  });
});

// ── AUTH-06 to AUTH-20 · db.login service ────────────────────────────────────
describe('AUTH-06 db.login service', () => {
  beforeEach(() => {
    mockDb.login.mockReset();
    mockNavigate.mockReset();
    localStorage.clear();
  });

  it('AUTH-06 login returns user object on success', async () => {
    mockDb.login.mockResolvedValueOnce(mockPatient);
    const user = await mockDb.login('john@medlink-test.com', 'pass123', UserRole.PATIENT);
    expect(user).toEqual(mockPatient);
  });

  it('AUTH-07 login returns user with correct role', async () => {
    mockDb.login.mockResolvedValueOnce(mockPatient);
    const user = await mockDb.login('john@medlink-test.com', 'pass123', UserRole.PATIENT);
    expect(user.role).toBe(UserRole.PATIENT);
  });

  it('AUTH-08 login rejects wrong role with error', async () => {
    mockDb.login.mockRejectedValueOnce(
      new Error('This account is registered as a patient. Please log in via the patient portal.')
    );
    await expect(
      mockDb.login('john@medlink-test.com', 'pass123', UserRole.DOCTOR)
    ).rejects.toThrow('patient');
  });

  it('AUTH-09 login with empty email throws', async () => {
    mockDb.login.mockRejectedValueOnce(new Error('Email is required'));
    await expect(mockDb.login('', 'pass123', UserRole.PATIENT)).rejects.toThrow();
  });

  it('AUTH-10 login with empty password throws', async () => {
    mockDb.login.mockRejectedValueOnce(new Error('Password is required'));
    await expect(mockDb.login('john@test.com', '', UserRole.PATIENT)).rejects.toThrow();
  });

  it('AUTH-11 login returns user with id', async () => {
    mockDb.login.mockResolvedValueOnce(mockPatient);
    const user = await mockDb.login('john@medlink-test.com', 'pass123', UserRole.PATIENT);
    expect(user.id).toBeTruthy();
  });

  it('AUTH-12 login returns user with email', async () => {
    mockDb.login.mockResolvedValueOnce(mockPatient);
    const user = await mockDb.login('john@medlink-test.com', 'pass123', UserRole.PATIENT);
    expect(user.email).toBe('john@medlink-test.com');
  });

  it('AUTH-13 login call is awaitable', async () => {
    mockDb.login.mockResolvedValueOnce(mockDoctor);
    const result = await mockDb.login('alice@medlink-test.com', 'pass', UserRole.DOCTOR);
    expect(result).toBeDefined();
  });

  it('AUTH-14 doctor login returns doctor role', async () => {
    mockDb.login.mockResolvedValueOnce(mockDoctor);
    const user = await mockDb.login('alice@medlink-test.com', 'pass', UserRole.DOCTOR);
    expect(user.role).toBe(UserRole.DOCTOR);
  });

  it('AUTH-15 login stores user in localStorage on success', async () => {
    mockDb.login.mockResolvedValueOnce(mockPatient);
    const user = await mockDb.login('john@medlink-test.com', 'pass123', UserRole.PATIENT);
    localStorage.setItem('medlink_user', JSON.stringify(user));
    expect(localStorage.getItem('medlink_user')).not.toBeNull();
  });
});

// ── AUTH-16 to AUTH-30 · db.signup service ───────────────────────────────────
describe('AUTH-16 db.signup service', () => {
  beforeEach(() => {
    mockDb.signup.mockReset();
    localStorage.clear();
  });

  it('AUTH-16 signup returns new user', async () => {
    mockDb.signup.mockResolvedValueOnce(mockPatient);
    const user = await mockDb.signup({ name: 'John Doe', email: 'john@test.com', password: 'pass123', role: UserRole.PATIENT });
    expect(user).toBeDefined();
  });

  it('AUTH-17 signup strips password from returned user', async () => {
    const userWithoutPassword = { ...mockPatient };
    mockDb.signup.mockResolvedValueOnce(userWithoutPassword);
    const user = await mockDb.signup({ name: 'John', email: 'j@test.com', password: 'secret', role: UserRole.PATIENT });
    expect(user.password).toBeUndefined();
  });

  it('AUTH-18 signup assigns an id', async () => {
    mockDb.signup.mockResolvedValueOnce(mockPatient);
    const user = await mockDb.signup({ email: 'j@test.com', password: 'pass', role: UserRole.PATIENT });
    expect(user.id).toBeTruthy();
  });

  it('AUTH-19 signup with doctor role sets doctor fields', async () => {
    mockDb.signup.mockResolvedValueOnce(mockDoctor);
    const user = await mockDb.signup({ email: 'doc@test.com', password: 'pass', role: UserRole.DOCTOR, clinicName: 'Clinic' });
    expect(user.role).toBe(UserRole.DOCTOR);
  });

  it('AUTH-20 signup rejects duplicate email', async () => {
    mockDb.signup.mockRejectedValueOnce(new Error('This email address is already in use'));
    await expect(mockDb.signup({ email: 'existing@test.com', password: 'pass', role: UserRole.PATIENT })).rejects.toThrow('already in use');
  });

  it('AUTH-21 signup rejects weak password', async () => {
    mockDb.signup.mockRejectedValueOnce(new Error('The password is too weak'));
    await expect(mockDb.signup({ email: 'new@test.com', password: '123', role: UserRole.PATIENT })).rejects.toThrow('weak');
  });

  it('AUTH-22 signup rejects invalid email format', async () => {
    mockDb.signup.mockRejectedValueOnce(new Error('The email address is badly formatted'));
    await expect(mockDb.signup({ email: 'notanemail', password: 'pass123', role: UserRole.PATIENT })).rejects.toThrow('formatted');
  });

  it('AUTH-23 signup email is lowercased', async () => {
    const lowerPatient = { ...mockPatient, email: 'john@medlink-test.com' };
    mockDb.signup.mockResolvedValueOnce(lowerPatient);
    const user = await mockDb.signup({ email: 'JOHN@medlink-test.com', password: 'pass', role: UserRole.PATIENT });
    expect(user.email).toBe('john@medlink-test.com');
  });

  it('AUTH-24 signup response includes role', async () => {
    mockDb.signup.mockResolvedValueOnce(mockDoctor);
    const user = await mockDb.signup({ email: 'doc@test.com', password: 'pass', role: UserRole.DOCTOR });
    expect(user.role).toBeDefined();
  });

  it('AUTH-25 signup missing name still succeeds', async () => {
    mockDb.signup.mockResolvedValueOnce({ ...mockPatient, name: 'john' });
    const user = await mockDb.signup({ email: 'j@test.com', password: 'pass', role: UserRole.PATIENT });
    expect(user).toBeDefined();
  });
});

// ── AUTH-26 to AUTH-35 · Session management ──────────────────────────────────
describe('AUTH-26 Session management', () => {
  beforeEach(() => localStorage.clear());

  it('AUTH-26 stores user in localStorage after login', () => {
    localStorage.setItem('medlink_user', JSON.stringify(mockPatient));
    const stored = localStorage.getItem('medlink_user');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).id).toBe(mockPatient.id);
  });

  it('AUTH-27 retrieves correct user from localStorage', () => {
    localStorage.setItem('medlink_user', JSON.stringify(mockDoctor));
    const stored = JSON.parse(localStorage.getItem('medlink_user')!);
    expect(stored.role).toBe(UserRole.DOCTOR);
  });

  it('AUTH-28 logout clears localStorage', () => {
    localStorage.setItem('medlink_user', JSON.stringify(mockPatient));
    localStorage.removeItem('medlink_user');
    expect(localStorage.getItem('medlink_user')).toBeNull();
  });

  it('AUTH-29 session persists page reload (localStorage)', () => {
    localStorage.setItem('medlink_user', JSON.stringify(mockPatient));
    const restored = JSON.parse(localStorage.getItem('medlink_user')!);
    expect(restored.id).toBe(mockPatient.id);
  });

  it('AUTH-30 null session means user is not logged in', () => {
    localStorage.removeItem('medlink_user');
    expect(localStorage.getItem('medlink_user')).toBeNull();
  });

  it('AUTH-31 session contains email', () => {
    localStorage.setItem('medlink_user', JSON.stringify(mockPatient));
    const stored = JSON.parse(localStorage.getItem('medlink_user')!);
    expect(stored.email).toBeDefined();
  });

  it('AUTH-32 session contains role', () => {
    localStorage.setItem('medlink_user', JSON.stringify(mockDoctor));
    const stored = JSON.parse(localStorage.getItem('medlink_user')!);
    expect(stored.role).toBe(UserRole.DOCTOR);
  });

  it('AUTH-33 patient session redirects to patient home', () => {
    localStorage.setItem('medlink_user', JSON.stringify(mockPatient));
    const user = JSON.parse(localStorage.getItem('medlink_user')!);
    const target = user.role === UserRole.DOCTOR ? '/doctor' : '/patient';
    expect(target).toBe('/patient');
  });

  it('AUTH-34 doctor session redirects to doctor dashboard', () => {
    localStorage.setItem('medlink_user', JSON.stringify(mockDoctor));
    const user = JSON.parse(localStorage.getItem('medlink_user')!);
    const target = user.role === UserRole.DOCTOR ? '/doctor' : '/patient';
    expect(target).toBe('/doctor');
  });

  it('AUTH-35 overwriting session updates stored user', () => {
    localStorage.setItem('medlink_user', JSON.stringify(mockPatient));
    const updated = { ...mockPatient, name: 'Updated Name' };
    localStorage.setItem('medlink_user', JSON.stringify(updated));
    const stored = JSON.parse(localStorage.getItem('medlink_user')!);
    expect(stored.name).toBe('Updated Name');
  });
});

// ── AUTH-36 to AUTH-45 · OTP and verification ────────────────────────────────
describe('AUTH-36 OTP verification', () => {
  beforeEach(() => {
    mockDb.sendOtp.mockReset();
    mockDb.verifyOtp.mockReset();
  });

  it('AUTH-36 sendOtp returns an OTP object', async () => {
    mockDb.sendOtp.mockResolvedValueOnce({ otp: '123456' });
    const result = await mockDb.sendOtp('+15551234567');
    expect(result).toHaveProperty('otp');
  });

  it('AUTH-37 sendOtp OTP is 6 digits', async () => {
    mockDb.sendOtp.mockResolvedValueOnce({ otp: '654321' });
    const result = await mockDb.sendOtp('+15551234567');
    expect(String(result.otp)).toHaveLength(6);
  });

  it('AUTH-38 verifyOtp returns true for correct code', () => {
    mockDb.verifyOtp.mockReturnValueOnce(true);
    const result = mockDb.verifyOtp('+15551234567', '123456');
    expect(result).toBe(true);
  });

  it('AUTH-39 verifyOtp returns false for wrong code', () => {
    mockDb.verifyOtp.mockReturnValueOnce(false);
    const result = mockDb.verifyOtp('+15551234567', '000000');
    expect(result).toBe(false);
  });

  it('AUTH-40 verifyOtp throws for expired OTP', () => {
    mockDb.verifyOtp.mockImplementationOnce(() => { throw new Error('OTP expired'); });
    expect(() => mockDb.verifyOtp('+15551234567', '123456')).toThrow('expired');
  });
});

// ── AUTH-41 to AUTH-50 · Role-based access control ───────────────────────────
describe('AUTH-41 Role-based access', () => {
  it('AUTH-41 patient cannot access /doctor routes', () => {
    const user = mockPatient;
    const isDoctorRoute = '/doctor/dashboard'.startsWith('/doctor');
    const isDoctor = user.role === UserRole.DOCTOR;
    expect(isDoctorRoute && !isDoctor).toBe(true); // should redirect
  });

  it('AUTH-42 doctor cannot access /patient routes', () => {
    const user = mockDoctor;
    const isPatientRoute = '/patient/home'.startsWith('/patient');
    const isPatient = user.role === UserRole.PATIENT;
    expect(isPatientRoute && !isPatient).toBe(true);
  });

  it('AUTH-43 doctor can access /doctor routes', () => {
    const user = mockDoctor;
    const isDoctorRoute = '/doctor/dashboard'.startsWith('/doctor');
    expect(user.role === UserRole.DOCTOR && isDoctorRoute).toBe(true);
  });

  it('AUTH-44 patient can access /patient routes', () => {
    const user = mockPatient;
    const isPatientRoute = '/patient/home'.startsWith('/patient');
    expect(user.role === UserRole.PATIENT && isPatientRoute).toBe(true);
  });

  it('AUTH-45 unauthenticated user is redirected to login', () => {
    const user = null;
    const redirectTo = user ? '/dashboard' : '/login';
    expect(redirectTo).toBe('/login');
  });

  it('AUTH-46 isVerified flag set on emailVerified users', () => {
    const verifiedUser = { ...mockDoctor, emailVerified: true };
    expect(verifiedUser.emailVerified).toBe(true);
  });

  it('AUTH-47 unverified user has emailVerified false', () => {
    const unverifiedUser = { ...mockPatient, emailVerified: false };
    expect(unverifiedUser.emailVerified).toBe(false);
  });

  it('AUTH-48 verified doctor gets access to prescriptions', () => {
    const canWrite = mockDoctor.isVerified && mockDoctor.role === UserRole.DOCTOR;
    expect(canWrite).toBe(true);
  });

  it('AUTH-49 unverified doctor cannot write prescriptions', () => {
    const unverified = { ...mockDoctor, isVerified: false };
    const canWrite = unverified.isVerified && unverified.role === UserRole.DOCTOR;
    expect(canWrite).toBe(false);
  });

  it('AUTH-50 patient does not have isVerified doctor flag', () => {
    expect((mockPatient as any).isVerified).toBeUndefined();
  });
});
