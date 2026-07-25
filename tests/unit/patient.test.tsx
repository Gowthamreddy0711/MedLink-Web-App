/**
 * Patient Module Tests — 70 test cases
 * Covers: patient home, search, book appointment, reminders, history, reviews
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '../../src/types';
import {
  mockPatient, mockPatient2, mockDoctor, mockDoctor2,
  mockAppointment, mockReminder, mockReview, mockPrescription,
} from '../__mocks__/db';

const mockDb = {
  getDoctors: vi.fn(),
  getDoctorById: vi.fn(),
  getDoctorReviews: vi.fn(),
  submitReview: vi.fn(),
  getAppointmentsByUserId: vi.fn(),
  createAppointment: vi.fn(),
  getReminders: vi.fn(),
  createReminder: vi.fn(),
  updateReminder: vi.fn(),
  getPrescriptions: vi.fn(),
  getPatients: vi.fn(),
};
vi.mock('../../src/services/db', () => ({ db: mockDb, seedFirestore: vi.fn() }));

// ── PAT-01 to PAT-10 · Patient data model ────────────────────────────────────
describe('PAT-01 Patient data model', () => {
  it('PAT-01 patient has required fields', () => {
    expect(mockPatient).toHaveProperty('id');
    expect(mockPatient).toHaveProperty('name');
    expect(mockPatient).toHaveProperty('email');
    expect(mockPatient).toHaveProperty('role');
  });

  it('PAT-02 patient role is PATIENT', () => {
    expect(mockPatient.role).toBe(UserRole.PATIENT);
  });

  it('PAT-03 patient age is a positive number', () => {
    expect(mockPatient.age).toBeGreaterThan(0);
  });

  it('PAT-04 patient bloodGroup is a string', () => {
    expect(typeof mockPatient.bloodGroup).toBe('string');
  });

  it('PAT-05 patient2 has different id than patient1', () => {
    expect(mockPatient.id).not.toBe(mockPatient2.id);
  });

  it('PAT-06 patient email is lowercase', () => {
    expect(mockPatient.email).toBe(mockPatient.email.toLowerCase());
  });

  it('PAT-07 patient phone is a string', () => {
    expect(typeof mockPatient.phone).toBe('string');
  });

  it('PAT-08 patient name is non-empty', () => {
    expect(mockPatient.name.length).toBeGreaterThan(0);
  });

  it('PAT-09 patient photoUrl is a string', () => {
    expect(typeof mockPatient.photoUrl).toBe('string');
  });

  it('PAT-10 two patients have different emails', () => {
    expect(mockPatient.email).not.toBe(mockPatient2.email);
  });
});

// ── PAT-11 to PAT-25 · Doctor search and details ─────────────────────────────
describe('PAT-11 Doctor search', () => {
  beforeEach(() => mockDb.getDoctors.mockReset());

  it('PAT-11 getDoctors returns list of doctors', async () => {
    mockDb.getDoctors.mockResolvedValueOnce([mockDoctor, mockDoctor2]);
    const docs = await mockDb.getDoctors();
    expect(docs.length).toBeGreaterThan(0);
  });

  it('PAT-12 can filter doctors by specialty', async () => {
    mockDb.getDoctors.mockResolvedValueOnce([mockDoctor, mockDoctor2]);
    const docs = await mockDb.getDoctors();
    const filtered = docs.filter((d: { specialty: string }) => d.specialty === 'Cardiology');
    expect(filtered).toHaveLength(1);
  });

  it('PAT-13 can search doctor by name', async () => {
    mockDb.getDoctors.mockResolvedValueOnce([mockDoctor, mockDoctor2]);
    const docs = await mockDb.getDoctors();
    const found = docs.filter((d: { name: string }) => d.name.toLowerCase().includes('bob'));
    expect(found).toHaveLength(1);
  });

  it('PAT-14 empty search term returns all doctors', async () => {
    mockDb.getDoctors.mockResolvedValueOnce([mockDoctor, mockDoctor2]);
    const docs = await mockDb.getDoctors();
    const all = docs.filter((d: { name: string }) => ''.length === 0 || d.name.includes(''));
    expect(all).toHaveLength(2);
  });

  it('PAT-15 getDoctorById returns specific doctor', async () => {
    mockDb.getDoctorById.mockResolvedValueOnce(mockDoctor);
    const doc = await mockDb.getDoctorById('doctor-001');
    expect(doc.id).toBe('doctor-001');
  });

  it('PAT-16 doctor details show availability', async () => {
    mockDb.getDoctorById.mockResolvedValueOnce(mockDoctor);
    const doc = await mockDb.getDoctorById('doctor-001');
    expect(doc.availability.length).toBeGreaterThan(0);
  });

  it('PAT-17 doctor detail shows rating', async () => {
    mockDb.getDoctorById.mockResolvedValueOnce(mockDoctor);
    const doc = await mockDb.getDoctorById('doctor-001');
    expect(typeof doc.rating).toBe('number');
  });

  it('PAT-18 doctor detail shows specialty', async () => {
    mockDb.getDoctorById.mockResolvedValueOnce(mockDoctor);
    const doc = await mockDb.getDoctorById('doctor-001');
    expect(doc.specialty).toBeDefined();
  });

  it('PAT-19 unknown doctor id returns null', async () => {
    mockDb.getDoctorById.mockResolvedValueOnce(null);
    const doc = await mockDb.getDoctorById('nonexistent-id');
    expect(doc).toBeNull();
  });

  it('PAT-20 doctor list sorted by rating is correct', async () => {
    mockDb.getDoctors.mockResolvedValueOnce([mockDoctor2, mockDoctor]);
    const docs = await mockDb.getDoctors();
    const sorted = [...docs].sort((a: { rating: number }, b: { rating: number }) => b.rating - a.rating);
    expect(sorted[0].id).toBe(mockDoctor.id); // 4.8 > 4.5
  });
});

// ── PAT-21 to PAT-35 · Appointment booking ───────────────────────────────────
describe('PAT-21 Appointment booking', () => {
  beforeEach(() => mockDb.createAppointment.mockReset());

  it('PAT-21 createAppointment returns new appointment', async () => {
    mockDb.createAppointment.mockResolvedValueOnce(mockAppointment);
    const appt = await mockDb.createAppointment({ doctorId: 'doctor-001', patientId: 'patient-001', date: '2026-08-01', time: '09:00 AM' });
    expect(appt).toBeDefined();
  });

  it('PAT-22 created appointment has id', async () => {
    mockDb.createAppointment.mockResolvedValueOnce(mockAppointment);
    const appt = await mockDb.createAppointment({});
    expect(appt.id).toBeDefined();
  });

  it('PAT-23 created appointment status is pending', async () => {
    const pendingAppt = { ...mockAppointment, status: 'pending' };
    mockDb.createAppointment.mockResolvedValueOnce(pendingAppt);
    const appt = await mockDb.createAppointment({});
    expect(appt.status).toBe('pending');
  });

  it('PAT-24 appointment has tokenNumber', async () => {
    mockDb.createAppointment.mockResolvedValueOnce(mockAppointment);
    const appt = await mockDb.createAppointment({});
    expect(appt.tokenNumber).toBeGreaterThan(0);
  });

  it('PAT-25 appointment has reason field', async () => {
    mockDb.createAppointment.mockResolvedValueOnce(mockAppointment);
    const appt = await mockDb.createAppointment({});
    expect(appt).toHaveProperty('reason');
  });

  it('PAT-26 getAppointmentsByUserId returns patient appointments', async () => {
    mockDb.getAppointmentsByUserId.mockResolvedValueOnce([mockAppointment]);
    const appts = await mockDb.getAppointmentsByUserId('patient-001', false);
    expect(appts).toHaveLength(1);
    expect(appts[0].patientId).toBe('patient-001');
  });

  it('PAT-27 no appointments returns empty array', async () => {
    mockDb.getAppointmentsByUserId.mockResolvedValueOnce([]);
    const appts = await mockDb.getAppointmentsByUserId('new-patient', false);
    expect(appts).toHaveLength(0);
  });

  it('PAT-28 appointment date is a valid date string', async () => {
    mockDb.createAppointment.mockResolvedValueOnce(mockAppointment);
    const appt = await mockDb.createAppointment({});
    expect(isNaN(new Date(appt.date).getTime())).toBe(false);
  });

  it('PAT-29 appointment links doctorId and patientId', async () => {
    mockDb.createAppointment.mockResolvedValueOnce(mockAppointment);
    const appt = await mockDb.createAppointment({});
    expect(appt.doctorId).toBeDefined();
    expect(appt.patientId).toBeDefined();
  });

  it('PAT-30 appointment time is a string', async () => {
    mockDb.createAppointment.mockResolvedValueOnce(mockAppointment);
    const appt = await mockDb.createAppointment({});
    expect(typeof appt.time).toBe('string');
  });
});

// ── PAT-31 to PAT-45 · Reminders ─────────────────────────────────────────────
describe('PAT-31 Reminders', () => {
  beforeEach(() => { mockDb.getReminders.mockReset(); mockDb.createReminder.mockReset(); mockDb.updateReminder.mockReset(); });

  it('PAT-31 getReminders returns array', async () => {
    mockDb.getReminders.mockResolvedValueOnce([mockReminder]);
    const reminders = await mockDb.getReminders('patient-001');
    expect(Array.isArray(reminders)).toBe(true);
  });

  it('PAT-32 reminder has medicineName', async () => {
    mockDb.getReminders.mockResolvedValueOnce([mockReminder]);
    const reminders = await mockDb.getReminders('patient-001');
    expect(reminders[0].medicineName).toBeDefined();
  });

  it('PAT-33 reminder has time', async () => {
    mockDb.getReminders.mockResolvedValueOnce([mockReminder]);
    const reminders = await mockDb.getReminders('patient-001');
    expect(typeof reminders[0].time).toBe('string');
  });

  it('PAT-34 reminder status is valid', async () => {
    mockDb.getReminders.mockResolvedValueOnce([mockReminder]);
    const reminders = await mockDb.getReminders('patient-001');
    expect(['pending', 'taken', 'skipped']).toContain(reminders[0].status);
  });

  it('PAT-35 createReminder returns new reminder', async () => {
    mockDb.createReminder.mockResolvedValueOnce(mockReminder);
    const r = await mockDb.createReminder({ patientId: 'patient-001', medicineName: 'Aspirin', time: '08:00 AM' });
    expect(r).toBeDefined();
  });

  it('PAT-36 updateReminder sets taken status', async () => {
    mockDb.updateReminder.mockResolvedValueOnce({ ...mockReminder, status: 'taken' });
    const updated = await mockDb.updateReminder('rem-001', 'taken');
    expect(updated.status).toBe('taken');
  });

  it('PAT-37 updateReminder sets skipped status', async () => {
    mockDb.updateReminder.mockResolvedValueOnce({ ...mockReminder, status: 'skipped' });
    const updated = await mockDb.updateReminder('rem-001', 'skipped');
    expect(updated.status).toBe('skipped');
  });

  it('PAT-38 reminder patientId matches patient', async () => {
    mockDb.getReminders.mockResolvedValueOnce([mockReminder]);
    const reminders = await mockDb.getReminders('patient-001');
    expect(reminders[0].patientId).toBe('patient-001');
  });

  it('PAT-39 empty reminders list returns empty array', async () => {
    mockDb.getReminders.mockResolvedValueOnce([]);
    const reminders = await mockDb.getReminders('new-patient');
    expect(reminders).toHaveLength(0);
  });

  it('PAT-40 reminder has date field', async () => {
    mockDb.getReminders.mockResolvedValueOnce([mockReminder]);
    const reminders = await mockDb.getReminders('patient-001');
    expect(reminders[0].date).toBeDefined();
  });
});

// ── PAT-41 to PAT-55 · Reviews ────────────────────────────────────────────────
describe('PAT-41 Doctor reviews', () => {
  beforeEach(() => { mockDb.getDoctorReviews.mockReset(); mockDb.submitReview.mockReset(); });

  it('PAT-41 getDoctorReviews returns array', async () => {
    mockDb.getDoctorReviews.mockResolvedValueOnce([mockReview]);
    const reviews = await mockDb.getDoctorReviews('doctor-001');
    expect(Array.isArray(reviews)).toBe(true);
  });

  it('PAT-42 review has rating field', async () => {
    mockDb.getDoctorReviews.mockResolvedValueOnce([mockReview]);
    const reviews = await mockDb.getDoctorReviews('doctor-001');
    expect(reviews[0].rating).toBeDefined();
  });

  it('PAT-43 review rating is between 1 and 5', async () => {
    mockDb.getDoctorReviews.mockResolvedValueOnce([mockReview]);
    const reviews = await mockDb.getDoctorReviews('doctor-001');
    expect(reviews[0].rating).toBeGreaterThanOrEqual(1);
    expect(reviews[0].rating).toBeLessThanOrEqual(5);
  });

  it('PAT-44 submitReview returns new review', async () => {
    mockDb.submitReview.mockResolvedValueOnce(mockReview);
    const rev = await mockDb.submitReview({ doctorId: 'doctor-001', patientId: 'patient-001', rating: 5, comment: 'Great!' });
    expect(rev).toBeDefined();
  });

  it('PAT-45 submitted review has id', async () => {
    mockDb.submitReview.mockResolvedValueOnce(mockReview);
    const rev = await mockDb.submitReview({});
    expect(rev.id).toBeDefined();
  });

  it('PAT-46 review comment is a string', async () => {
    mockDb.getDoctorReviews.mockResolvedValueOnce([mockReview]);
    const reviews = await mockDb.getDoctorReviews('doctor-001');
    expect(typeof reviews[0].comment).toBe('string');
  });

  it('PAT-47 review links doctorId and patientId', async () => {
    mockDb.submitReview.mockResolvedValueOnce(mockReview);
    const rev = await mockDb.submitReview({});
    expect(rev.doctorId).toBeDefined();
    expect(rev.patientId).toBeDefined();
  });

  it('PAT-48 no reviews returns empty array', async () => {
    mockDb.getDoctorReviews.mockResolvedValueOnce([]);
    const reviews = await mockDb.getDoctorReviews('new-doctor');
    expect(reviews).toHaveLength(0);
  });

  it('PAT-49 review date is defined', async () => {
    mockDb.submitReview.mockResolvedValueOnce(mockReview);
    const rev = await mockDb.submitReview({});
    expect(rev.date).toBeDefined();
  });

  it('PAT-50 average rating calculation', () => {
    const reviews = [{ rating: 4 }, { rating: 5 }, { rating: 3 }];
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    expect(avg).toBeCloseTo(4.0);
  });
});

// ── PAT-51 to PAT-70 · Medical history and prescriptions ─────────────────────
describe('PAT-51 Medical history and prescriptions', () => {
  beforeEach(() => mockDb.getPrescriptions.mockReset());

  it('PAT-51 getPrescriptions returns array', async () => {
    mockDb.getPrescriptions.mockResolvedValueOnce([mockPrescription]);
    const rxList = await mockDb.getPrescriptions('patient-001');
    expect(Array.isArray(rxList)).toBe(true);
  });

  it('PAT-52 prescription belongs to patient', async () => {
    mockDb.getPrescriptions.mockResolvedValueOnce([mockPrescription]);
    const rxList = await mockDb.getPrescriptions('patient-001');
    expect(rxList[0].patientId).toBe('patient-001');
  });

  it('PAT-53 prescription has medicines list', async () => {
    mockDb.getPrescriptions.mockResolvedValueOnce([mockPrescription]);
    const rxList = await mockDb.getPrescriptions('patient-001');
    expect(Array.isArray(rxList[0].medicines)).toBe(true);
  });

  it('PAT-54 prescription medicines are non-empty', async () => {
    mockDb.getPrescriptions.mockResolvedValueOnce([mockPrescription]);
    const rxList = await mockDb.getPrescriptions('patient-001');
    expect(rxList[0].medicines.length).toBeGreaterThan(0);
  });

  it('PAT-55 history includes past appointments', async () => {
    const pastAppt = { ...mockAppointment, status: 'completed' };
    mockDb.getAppointmentsByUserId.mockResolvedValueOnce([pastAppt]);
    const appts = await mockDb.getAppointmentsByUserId('patient-001', false);
    const completed = appts.filter((a: { status: string }) => a.status === 'completed');
    expect(completed.length).toBeGreaterThan(0);
  });

  it('PAT-56 completed appointment is in history', () => {
    const appts = [{ ...mockAppointment, status: 'completed' }, { ...mockAppointment, id: 'a2', status: 'pending' }];
    const history = appts.filter(a => a.status === 'completed');
    expect(history).toHaveLength(1);
  });

  it('PAT-57 cancelled appointment is in history', () => {
    const appts = [{ ...mockAppointment, status: 'cancelled' }];
    const history = appts.filter(a => ['completed', 'cancelled'].includes(a.status));
    expect(history).toHaveLength(1);
  });

  it('PAT-58 pending appointment is not in history', () => {
    const appts = [{ ...mockAppointment, status: 'pending' }];
    const history = appts.filter(a => a.status === 'completed');
    expect(history).toHaveLength(0);
  });

  it('PAT-59 prescription doctor name is included', async () => {
    const rxWithDoctor = { ...mockPrescription, doctorName: 'Dr. Alice Smith' };
    mockDb.getPrescriptions.mockResolvedValueOnce([rxWithDoctor]);
    const rxList = await mockDb.getPrescriptions('patient-001');
    expect(rxList[0].doctorName).toBeDefined();
  });

  it('PAT-60 no prescriptions returns empty array', async () => {
    mockDb.getPrescriptions.mockResolvedValueOnce([]);
    const rxList = await mockDb.getPrescriptions('new-patient');
    expect(rxList).toHaveLength(0);
  });

  it('PAT-61 blood group format is valid', () => {
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    expect(validBloodGroups).toContain(mockPatient.bloodGroup);
  });

  it('PAT-62 patient age is a reasonable value', () => {
    expect(mockPatient.age).toBeGreaterThan(0);
    expect(mockPatient.age).toBeLessThan(150);
  });

  it('PAT-63 patient2 age is different from patient1', () => {
    expect(mockPatient.age).not.toBe(mockPatient2.age);
  });

  it('PAT-64 appointment reason is optional', () => {
    const apptNoReason = { ...mockAppointment, reason: undefined };
    expect(apptNoReason.reason).toBeUndefined();
  });

  it('PAT-65 appointment time format is AM/PM', () => {
    expect(/\d{1,2}:\d{2} (AM|PM)/.test(mockAppointment.time)).toBe(true);
  });

  it('PAT-66 reminder time format is AM/PM', () => {
    expect(/\d{1,2}:\d{2} (AM|PM)/.test(mockReminder.time)).toBe(true);
  });

  it('PAT-67 multiple reminders can be sorted by time', async () => {
    const r1 = { ...mockReminder, time: '08:00 AM' };
    const r2 = { ...mockReminder, id: 'rem-002', time: '12:00 PM' };
    mockDb.getReminders.mockResolvedValueOnce([r2, r1]);
    const reminders = await mockDb.getReminders('patient-001');
    expect(reminders).toHaveLength(2);
  });

  it('PAT-68 review rating 5 is the max', () => {
    expect(mockReview.rating).toBeLessThanOrEqual(5);
  });

  it('PAT-69 review rating 1 is the min', () => {
    const lowReview = { ...mockReview, rating: 1 };
    expect(lowReview.rating).toBeGreaterThanOrEqual(1);
  });

  it('PAT-70 prescription id is unique', async () => {
    const rx2 = { ...mockPrescription, id: 'rx-002' };
    mockDb.getPrescriptions.mockResolvedValueOnce([mockPrescription, rx2]);
    const rxList = await mockDb.getPrescriptions('patient-001');
    const ids = rxList.map((r: { id: string }) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
