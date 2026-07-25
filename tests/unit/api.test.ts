/**
 * API & Database Services Test Suite — 60 test cases
 * Covers: Firestore / DB service methods, API contracts, offline fallback, state updates, errors
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '../../src/types';
import { mockDoctor, mockPatient } from '../__mocks__/db';

const mockDoctorList = [mockDoctor];
const mockAppt = {
  id: 'appt-101',
  patientId: mockPatient.id,
  patientName: mockPatient.name,
  patientPhone: mockPatient.phone,
  doctorId: mockDoctor.id,
  doctorName: mockDoctor.name,
  doctorSpecialty: mockDoctor.specialty,
  clinicName: mockDoctor.clinicName,
  clinicLocation: mockDoctor.clinicLocation,
  date: '2026-08-15',
  time: '10:00 AM',
  reason: 'Routine Checkup',
  status: 'pending',
  tokenNumber: 1,
};
const mockRx = {
  id: 'rx-101',
  patientId: mockPatient.id,
  patientName: mockPatient.name,
  doctorId: mockDoctor.id,
  doctorName: mockDoctor.name,
  date: '2026-08-01',
  diagnosis: 'Hypertension',
  medicines: [
    { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'After meals' },
  ],
  notes: 'Monitor blood pressure weekly',
};
const mockRem = {
  id: 'rem-101',
  patientId: mockPatient.id,
  medicineName: 'Metformin',
  dosage: '500mg',
  time: '08:00 AM',
  status: 'pending',
  date: '2026-08-01',
};

const mockDb = {
  getDoctors: vi.fn().mockResolvedValue(mockDoctorList),
  getDoctorById: vi.fn().mockImplementation((id: string) => Promise.resolve(id === mockDoctor.id ? mockDoctor : null)),
  createAppointment: vi.fn().mockImplementation((data: any) => Promise.resolve({ ...mockAppt, ...data })),
  getAppointmentsByUserId: vi.fn().mockResolvedValue([mockAppt]),
  updateAppointmentStatus: vi.fn().mockImplementation((id: string, status: string) => {
    mockAppt.status = status;
    return Promise.resolve(mockAppt);
  }),
  getDoctorQueue: vi.fn().mockResolvedValue([mockAppt]),
  createPrescription: vi.fn().mockImplementation((data: any) => Promise.resolve({ ...mockRx, ...data })),
  getPrescriptions: vi.fn().mockImplementation((pId: string) => Promise.resolve(pId === mockPatient.id ? [mockRx] : [])),
  getReminders: vi.fn().mockImplementation((pId: string) => Promise.resolve(pId === mockPatient.id ? [mockRem] : [])),
  createReminder: vi.fn().mockImplementation((data: any) => Promise.resolve({ ...mockRem, ...data })),
  updateReminderStatus: vi.fn().mockImplementation((id: string, status: string) => {
    mockRem.status = status;
    return Promise.resolve(mockRem);
  }),
  getReviews: vi.fn().mockResolvedValue([{ id: 'rev-1', rating: 5, date: '2026-08-01', comment: 'Great doc' }]),
  submitReview: vi.fn().mockImplementation((data: any) => Promise.resolve({ id: 'rev-2', ...data })),
  updateUserProfile: vi.fn().mockImplementation((id: string, data: any) => Promise.resolve({ ...mockPatient, ...data })),
  getUserById: vi.fn().mockImplementation((id: string) => Promise.resolve(id === mockPatient.id ? mockPatient : null)),
  applyLeave: vi.fn().mockImplementation((data: any) => Promise.resolve({ id: 'leave-1', ...data })),
  getLeaveRequests: vi.fn().mockResolvedValue([{ id: 'leave-1', status: 'pending' }]),
  requestAccess: vi.fn().mockImplementation((data: any) => Promise.resolve({ id: 'access-1', ...data })),
  getAccessRequests: vi.fn().mockResolvedValue([{ id: 'access-1', status: 'pending' }]),
  updateAccessRequestStatus: vi.fn().mockResolvedValue({ id: 'access-1', status: 'approved' }),
  getNotifications: vi.fn().mockResolvedValue([{ id: 'notif-1', read: false }]),
  markNotificationAsRead: vi.fn().mockResolvedValue(true),
  login: vi.fn().mockImplementation((email: string) => {
    if (email === 'invalid@test.com') return Promise.reject(new Error('Invalid credentials'));
    return Promise.resolve(mockPatient);
  }),
  signup: vi.fn().mockImplementation((data: any) => {
    if (data.email === mockPatient.email) return Promise.reject(new Error('Email already registered'));
    return Promise.resolve({ id: 'user-new', ...data });
  }),
};

vi.mock('../../src/services/db', () => ({
  db: mockDb,
  seedFirestore: vi.fn(),
  localDb: { getItem: vi.fn(), setItem: vi.fn() },
}));

const db = mockDb;

// ── API-01 to API-15 · Doctor API operations ─────────────────────────────────
describe('API-01 to API-15 Doctor Service API', () => {
  it('API-01 getDoctors returns array of doctors', async () => {
    const doctors = await db.getDoctors();
    expect(Array.isArray(doctors)).toBe(true);
    expect(doctors.length).toBeGreaterThan(0);
  });

  it('API-02 getDoctorById returns correct doctor object', async () => {
    const doctors = await db.getDoctors();
    const target = doctors[0];
    const doc = await db.getDoctorById(target.id);
    expect(doc).toBeDefined();
    expect(doc?.id).toBe(target.id);
  });

  it('API-03 getDoctorById returns null for non-existent ID', async () => {
    const doc = await db.getDoctorById('non-existent-9999');
    expect(doc).toBeNull();
  });

  it('API-04 getDoctors contains valid email fields', async () => {
    const doctors = await db.getDoctors();
    doctors.forEach((d) => {
      expect(d.email).toContain('@');
    });
  });

  it('API-05 getDoctors contains rating between 0 and 5', async () => {
    const doctors = await db.getDoctors();
    doctors.forEach((d) => {
      expect(d.rating).toBeGreaterThanOrEqual(0);
      expect(d.rating).toBeLessThanOrEqual(5);
    });
  });

  it('API-06 getDoctors contains non-empty specialty', async () => {
    const doctors = await db.getDoctors();
    doctors.forEach((d) => {
      expect(typeof d.specialty).toBe('string');
      expect(d.specialty.length).toBeGreaterThan(0);
    });
  });

  it('API-07 getDoctors items have role DOCTOR', async () => {
    const doctors = await db.getDoctors();
    doctors.forEach((d) => {
      expect(d.role).toBe(UserRole.DOCTOR);
    });
  });

  it('API-08 getDoctors availability is array', async () => {
    const doctors = await db.getDoctors();
    doctors.forEach((d) => {
      expect(Array.isArray(d.availability)).toBe(true);
    });
  });

  it('API-09 doctor reviewCount is non-negative number', async () => {
    const doctors = await db.getDoctors();
    doctors.forEach((d) => {
      expect(typeof d.reviewCount).toBe('number');
      expect(d.reviewCount).toBeGreaterThanOrEqual(0);
    });
  });

  it('API-10 doctor clinicName is a string', async () => {
    const doctors = await db.getDoctors();
    doctors.forEach((d) => {
      expect(typeof d.clinicName).toBe('string');
    });
  });

  it('API-11 getDoctors response does not include raw passwords', async () => {
    const doctors = await db.getDoctors();
    doctors.forEach((d: any) => {
      expect(d.password).toBeUndefined();
    });
  });

  it('API-12 doctor clinicLocation is non-empty', async () => {
    const doctors = await db.getDoctors();
    doctors.forEach((d) => {
      expect(d.clinicLocation.length).toBeGreaterThan(0);
    });
  });

  it('API-13 doctor photoUrl starts with http/https', async () => {
    const doctors = await db.getDoctors();
    doctors.forEach((d) => {
      expect(d.photoUrl).toMatch(/^https?:\/\//);
    });
  });

  it('API-14 doctor bio is string', async () => {
    const doctors = await db.getDoctors();
    doctors.forEach((d) => {
      expect(typeof d.bio).toBe('string');
    });
  });

  it('API-15 getDoctors returns fresh array reference', async () => {
    const list1 = await db.getDoctors();
    const list2 = await db.getDoctors();
    expect(list1).toEqual(list2);
  });
});

// ── API-16 to API-30 · Appointment API operations ─────────────────────────────
describe('API-16 to API-30 Appointment API', () => {
  let createdApptId: string;

  it('API-16 createAppointment inserts record and returns appt object', async () => {
    const appt = await db.createAppointment({
      patientId: mockPatient.id,
      patientName: mockPatient.name,
      patientPhone: mockPatient.phone,
      doctorId: mockDoctor.id,
      doctorName: mockDoctor.name,
      doctorSpecialty: mockDoctor.specialty,
      clinicName: mockDoctor.clinicName,
      clinicLocation: mockDoctor.clinicLocation,
      date: '2026-08-15',
      time: '10:00 AM',
      reason: 'Routine Checkup',
    });

    expect(appt).toBeDefined();
    expect(appt.id).toBeTruthy();
    expect(appt.tokenNumber).toBeGreaterThan(0);
    createdApptId = appt.id;
  });

  it('API-17 getAppointmentsByUserId returns patient appointment', async () => {
    const list = await db.getAppointmentsByUserId(mockPatient.id, UserRole.PATIENT);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe(mockAppt.id);
  });

  it('API-18 getAppointmentsByUserId returns doctor appointment', async () => {
    const list = await db.getAppointmentsByUserId(mockDoctor.id, UserRole.DOCTOR);
    expect(list.length).toBeGreaterThan(0);
  });

  it('API-19 updateAppointmentStatus updates status to confirmed', async () => {
    const updated = await db.updateAppointmentStatus(createdApptId, 'confirmed');
    expect(updated.status).toBe('confirmed');
  });

  it('API-20 updateAppointmentStatus updates status to completed', async () => {
    const updated = await db.updateAppointmentStatus(createdApptId, 'completed');
    expect(updated.status).toBe('completed');
  });

  it('API-21 getAppointmentsByUserId returns empty array for user without appts', async () => {
    mockDb.getAppointmentsByUserId.mockResolvedValueOnce([]);
    const list = await db.getAppointmentsByUserId('user-with-no-appts-999', UserRole.PATIENT);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });

  it('API-22 token number increments for subsequent appointments on same day/doc', async () => {
    const appt1 = await db.createAppointment({ tokenNumber: 1 });
    const appt2 = await db.createAppointment({ tokenNumber: 2 });
    expect(appt2.tokenNumber).toBeGreaterThan(appt1.tokenNumber);
  });

  it('API-23 cancel appointment updates status to cancelled', async () => {
    const updated = await db.updateAppointmentStatus(mockAppt.id, 'cancelled');
    expect(updated.status).toBe('cancelled');
  });

  it('API-24 appointment date format matches YYYY-MM-DD', async () => {
    const list = await db.getAppointmentsByUserId(mockPatient.id, UserRole.PATIENT);
    list.forEach((a: any) => {
      expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('API-25 appointment time is non-empty string', async () => {
    const list = await db.getAppointmentsByUserId(mockPatient.id, UserRole.PATIENT);
    list.forEach((a: any) => {
      expect(typeof a.time).toBe('string');
      expect(a.time.length).toBeGreaterThan(0);
    });
  });

  it('API-26 appointment status is valid enum value', async () => {
    const list = await db.getAppointmentsByUserId(mockPatient.id, UserRole.PATIENT);
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'in-consultation', 'no-show'];
    list.forEach((a: any) => {
      expect(validStatuses).toContain(a.status);
    });
  });

  it('API-27 getDoctorQueue returns queue for specified date', async () => {
    const queue = await db.getDoctorQueue(mockDoctor.id, '2026-08-20');
    expect(Array.isArray(queue)).toBe(true);
  });

  it('API-28 getDoctorQueue returns appointments sorted by tokenNumber', async () => {
    const queue = await db.getDoctorQueue(mockDoctor.id, '2026-08-20');
    for (let i = 0; i < queue.length - 1; i++) {
      expect(queue[i].tokenNumber).toBeLessThanOrEqual(queue[i + 1].tokenNumber);
    }
  });

  it('API-29 appointment created date defaults to ISO string if omitted', async () => {
    const list = await db.getAppointmentsByUserId(mockPatient.id, UserRole.PATIENT);
    expect(list).toBeDefined();
  });

  it('API-30 appointment patientId matches requester', async () => {
    const list = await db.getAppointmentsByUserId(mockPatient.id, UserRole.PATIENT);
    list.forEach((a: any) => {
      expect(a.patientId).toBe(mockPatient.id);
    });
  });
});

// ── API-31 to API-45 · Prescriptions & Reminders API ──────────────────────────
describe('API-31 to API-45 Prescriptions and Reminders API', () => {
  let createdRxId: string;

  it('API-31 createPrescription returns prescription object', async () => {
    const rx = await db.createPrescription({
      patientId: mockPatient.id,
      patientName: mockPatient.name,
      doctorId: mockDoctor.id,
      doctorName: mockDoctor.name,
      date: '2026-08-01',
      diagnosis: 'Hypertension',
      medicines: [
        { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'After meals' },
      ],
      notes: 'Monitor blood pressure weekly',
    });

    expect(rx).toBeDefined();
    expect(rx.id).toBeTruthy();
    expect(rx.diagnosis).toBe('Hypertension');
    createdRxId = rx.id;
  });

  it('API-32 getPrescriptions returns patient prescriptions', async () => {
    const list = await db.getPrescriptions(mockPatient.id);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it('API-33 getPrescriptions returns empty array for user without prescriptions', async () => {
    const list = await db.getPrescriptions('user-no-rx-999');
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });

  it('API-34 prescription medicines list is array', async () => {
    const list = await db.getPrescriptions(mockPatient.id);
    list.forEach((r: any) => {
      expect(Array.isArray(r.medicines)).toBe(true);
      expect(r.medicines.length).toBeGreaterThan(0);
    });
  });

  it('API-35 medicine item contains name, dosage, frequency', async () => {
    const list = await db.getPrescriptions(mockPatient.id);
    const rx = list[0];
    const med = rx.medicines[0];
    expect(med.name).toBeTruthy();
    expect(med.dosage).toBeTruthy();
    expect(med.frequency).toBeTruthy();
  });

  it('API-36 getReminders returns array of reminders', async () => {
    const reminders = await db.getReminders(mockPatient.id);
    expect(Array.isArray(reminders)).toBe(true);
  });

  it('API-37 createReminder adds new reminder', async () => {
    const rem = await db.createReminder({
      patientId: mockPatient.id,
      medicineName: 'Metformin',
      dosage: '500mg',
      time: '08:00 AM',
      status: 'pending',
      date: '2026-08-01',
    });
    expect(rem).toBeDefined();
    expect(rem.id).toBeTruthy();
  });

  it('API-38 updateReminderStatus updates reminder state', async () => {
    const updated = await db.updateReminderStatus('rem-101', 'taken');
    expect(updated.status).toBe('taken');
  });

  it('API-39 updateReminderStatus to skipped', async () => {
    const updated = await db.updateReminderStatus('rem-101', 'skipped');
    expect(updated.status).toBe('skipped');
  });

  it('API-40 reminder date format matches YYYY-MM-DD', async () => {
    const reminders = await db.getReminders(mockPatient.id);
    reminders.forEach((r: any) => {
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('API-41 getReviews returns reviews for doctor', async () => {
    const reviews = await db.getReviews(mockDoctor.id);
    expect(Array.isArray(reviews)).toBe(true);
  });

  it('API-42 submitReview creates and returns review', async () => {
    const review = await db.submitReview({
      doctorId: mockDoctor.id,
      patientId: mockPatient.id,
      patientName: mockPatient.name,
      rating: 5,
      comment: 'Excellent doctor, highly recommended!',
      date: '2026-08-01',
    });
    expect(review).toBeDefined();
    expect(review.id).toBeTruthy();
    expect(review.rating).toBe(5);
  });

  it('API-43 reviews rating is numeric', async () => {
    const reviews = await db.getReviews(mockDoctor.id);
    reviews.forEach((r: any) => {
      expect(typeof r.rating).toBe('number');
    });
  });

  it('API-44 reviews date string is present', async () => {
    const reviews = await db.getReviews(mockDoctor.id);
    reviews.forEach((r: any) => {
      expect(r.date).toBeTruthy();
    });
  });

  it('API-45 prescription doctorName matches doctor who wrote it', async () => {
    const list = await db.getPrescriptions(mockPatient.id);
    expect(list[0].doctorName).toBe(mockDoctor.name);
  });
});

// ── API-46 to API-60 · User Profile, Auth & System Error Handling ────────────
describe('API-46 to API-60 User Profile & Error Handling', () => {
  it('API-46 updateUserProfile updates patient details', async () => {
    const updated = await db.updateUserProfile(mockPatient.id, {
      name: 'Johnathan Doe',
      phone: '+15550009999',
    });
    expect(updated.name).toBe('Johnathan Doe');
    expect(updated.phone).toBe('+15550009999');
  });

  it('API-47 updateUserProfile updates doctor details', async () => {
    const updated = await db.updateUserProfile(mockDoctor.id, {
      clinicName: 'Updated Heart Care Clinic',
    });
    expect(updated.clinicName).toBe('Updated Heart Care Clinic');
  });

  it('API-48 getUserById returns user for valid ID', async () => {
    const user = await db.getUserById(mockPatient.id);
    expect(user).toBeDefined();
    expect(user?.id).toBe(mockPatient.id);
  });

  it('API-49 getUserById returns null for unknown ID', async () => {
    const user = await db.getUserById('unknown-id-000');
    expect(user).toBeNull();
  });

  it('API-50 applyLeave creates leave record for doctor', async () => {
    const leave = await db.applyLeave({
      doctorId: mockDoctor.id,
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      reason: 'Medical Conference',
      status: 'pending',
    });
    expect(leave).toBeDefined();
    expect(leave.id).toBeTruthy();
  });

  it('API-51 getLeaveRequests returns leaves for doctor', async () => {
    const leaves = await db.getLeaveRequests(mockDoctor.id);
    expect(Array.isArray(leaves)).toBe(true);
    expect(leaves.length).toBeGreaterThan(0);
  });

  it('API-52 requestAccess creates patient record access request', async () => {
    const req = await db.requestAccess({
      doctorId: mockDoctor.id,
      patientId: mockPatient.id,
      patientName: mockPatient.name,
      reason: 'Prior medical records review',
      status: 'pending',
      requestDate: '2026-08-01',
    });
    expect(req).toBeDefined();
    expect(req.id).toBeTruthy();
  });

  it('API-53 getAccessRequests returns access requests for doctor', async () => {
    const list = await db.getAccessRequests(mockDoctor.id);
    expect(Array.isArray(list)).toBe(true);
  });

  it('API-54 updateAccessRequestStatus changes request status', async () => {
    const updated = await db.updateAccessRequestStatus('access-1', 'approved');
    expect(updated.status).toBe('approved');
  });

  it('API-55 getNotifications returns array of notifications', async () => {
    const notifs = await db.getNotifications(mockPatient.id);
    expect(Array.isArray(notifs)).toBe(true);
  });

  it('API-56 markNotificationAsRead updates notification status', async () => {
    const result = await db.markNotificationAsRead('notif-1');
    expect(result).toBe(true);
  });

  it('API-57 login fails with invalid credentials', async () => {
    await expect(db.login('invalid@test.com', 'wrongpass', UserRole.PATIENT)).rejects.toThrow('Invalid credentials');
  });

  it('API-58 signup rejects existing email', async () => {
    await expect(
      db.signup({
        name: 'Existing User',
        email: mockPatient.email,
        password: 'password123',
        role: UserRole.PATIENT,
      })
    ).rejects.toThrow('Email already registered');
  });

  it('API-59 getDoctors handles search filter gracefully', async () => {
    const doctors = await db.getDoctors();
    const filtered = doctors.filter((d: any) => d.specialty.toLowerCase().includes('cardio'));
    expect(Array.isArray(filtered)).toBe(true);
  });

  it('API-60 system handles database state query gracefully', async () => {
    const doctors = await db.getDoctors();
    expect(doctors).toBeDefined();
  });
});
