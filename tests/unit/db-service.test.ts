import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, localDb } from '../../src/services/db';
import { createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { getDocs, getDoc } from 'firebase/firestore';
import { UserRole } from '../../src/types';

const mockedGetDocs = vi.mocked(getDocs);
const mockedGetDoc = vi.mocked(getDoc);
const mockedCreateUser = vi.mocked(createUserWithEmailAndPassword);
const mockedSignInAnon = vi.mocked(signInAnonymously);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('Database service helpers and fallback behavior', () => {
  it('normalizeDoctorAvailability returns future availability when past dates are provided', () => {
    const doctor = {
      id: 'doc-001',
      availability: [
        { date: '2020-01-01', times: ['09:00 AM'] },
      ],
    };

    const normalized = db.normalizeDoctorAvailability(doctor);
    expect(Array.isArray(normalized.availability)).toBe(true);
    expect(normalized.availability.length).toBe(5);
    expect(new Date(normalized.availability[0].date).getTime()).toBeGreaterThanOrEqual(new Date().setHours(0, 0, 0, 0));
  });

  it('normalizeDoctorAvailability preserves valid future slots', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const formattedDate = futureDate.toISOString().split('T')[0];

    const doctor = {
      id: 'doc-002',
      availability: [
        { date: formattedDate, times: ['09:00 AM', '10:00 AM'] },
      ],
    };

    const normalized = db.normalizeDoctorAvailability(doctor);
    expect(normalized.availability).toEqual(doctor.availability);
  });

  it('getDoctorById returns local fallback when Firestore load fails', async () => {
    const localDoctor = {
      id: 'doc-local-001',
      role: UserRole.DOCTOR,
      email: 'fallback@medlink.test',
      name: 'Dr. Fallback',
      availability: [{ date: '2099-01-01', times: ['09:00 AM'] }],
    };
    localStorage.setItem('medlink_local_users', JSON.stringify([localDoctor]));

    mockedGetDoc.mockRejectedValueOnce(new Error('Firestore unavailable'));

    const result = await db.getDoctorById(localDoctor.id);
    expect(result).toMatchObject({ id: localDoctor.id, email: localDoctor.email });
  });

  it('getDoctors falls back to local registry when Firestore query fails', async () => {
    const localDoctor = {
      id: 'doc-local-002',
      role: UserRole.DOCTOR,
      email: 'local2@medlink.test',
      name: 'Dr. Local 2',
      availability: [{ date: '2099-09-09', times: ['10:00 AM'] }],
    };
    localStorage.setItem('medlink_local_users', JSON.stringify([localDoctor]));

    mockedGetDocs.mockRejectedValueOnce(new Error('Firestore query failure'));

    const doctors = await db.getDoctors();
    expect(doctors).toHaveLength(1);
    expect(doctors[0]).toMatchObject({ email: localDoctor.email });
  });

  it('signup fallback writes a local user when anonymous sign-in is unavailable', async () => {
    mockedCreateUser.mockRejectedValueOnce({ code: 'auth/operation-not-allowed' });
    mockedSignInAnon.mockRejectedValueOnce(new Error('anonymous sign-in blocked'));

    const user = await db.signup({
      email: 'fallback-register@medlink.test',
      password: 'Password123',
      role: UserRole.PATIENT,
    });

    expect(user.email).toBe('fallback-register@medlink.test');
    expect(user.isEmailProviderDisabled).toBe(true);

    const localUsers = localDb.getItem<any[]>('medlink_local_users', []);
    expect(localUsers.some((u) => u.email === user.email)).toBe(true);
  });
});
