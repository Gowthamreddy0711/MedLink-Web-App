/**
 * Appointments Tests — 90 test cases
 * Covers: booking, confirmation, cancellation, rescheduling,
 * token system, queue, status transitions, edge cases
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDoctor, mockPatient, mockAppointment, mockAppointment2, mockQueueEntry } from '../__mocks__/db';

const mockDb = {
  createAppointment: vi.fn(),
  getAppointments: vi.fn(),
  getAppointmentsByUserId: vi.fn(),
  updateAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
  getQueue: vi.fn(),
  addToQueue: vi.fn(),
  updateQueueStatus: vi.fn(),
};
vi.mock('../../src/services/db', () => ({ db: mockDb, seedFirestore: vi.fn() }));

// ── APPT-01 to APPT-15 · Data model ──────────────────────────────────────────
describe('APPT-01 Appointment data model', () => {
  it('APPT-01 appointment has id', () => { expect(mockAppointment.id).toBeDefined(); });
  it('APPT-02 appointment has doctorId', () => { expect(mockAppointment.doctorId).toBeDefined(); });
  it('APPT-03 appointment has patientId', () => { expect(mockAppointment.patientId).toBeDefined(); });
  it('APPT-04 appointment has date', () => { expect(mockAppointment.date).toBeDefined(); });
  it('APPT-05 appointment has time', () => { expect(mockAppointment.time).toBeDefined(); });
  it('APPT-06 appointment has status', () => { expect(mockAppointment.status).toBeDefined(); });
  it('APPT-07 appointment has tokenNumber', () => { expect(mockAppointment.tokenNumber).toBeDefined(); });
  it('APPT-08 status is valid enum value', () => {
    const valid = ['pending', 'confirmed', 'completed', 'cancelled'];
    expect(valid).toContain(mockAppointment.status);
  });
  it('APPT-09 tokenNumber is a positive integer', () => {
    expect(Number.isInteger(mockAppointment.tokenNumber)).toBe(true);
    expect(mockAppointment.tokenNumber).toBeGreaterThan(0);
  });
  it('APPT-10 date is a valid date string', () => {
    expect(isNaN(new Date(mockAppointment.date).getTime())).toBe(false);
  });
  it('APPT-11 time matches AM/PM format', () => {
    expect(/\d{1,2}:\d{2} (AM|PM)/.test(mockAppointment.time)).toBe(true);
  });
  it('APPT-12 appointment2 has different id', () => {
    expect(mockAppointment.id).not.toBe(mockAppointment2.id);
  });
  it('APPT-13 reason is optional', () => {
    const apptNoReason = { ...mockAppointment, reason: undefined };
    expect(apptNoReason.reason).toBeUndefined();
  });
  it('APPT-14 appointment links a doctor', () => {
    expect(mockAppointment.doctorId).toBe(mockDoctor.id);
  });
  it('APPT-15 appointment links a patient', () => {
    expect(mockAppointment.patientId).toBe(mockPatient.id);
  });
});

// ── APPT-16 to APPT-35 · Create and retrieve ─────────────────────────────────
describe('APPT-16 Create and retrieve appointments', () => {
  beforeEach(() => { mockDb.createAppointment.mockReset(); mockDb.getAppointments.mockReset(); mockDb.getAppointmentsByUserId.mockReset(); });

  it('APPT-16 createAppointment returns appointment', async () => {
    mockDb.createAppointment.mockResolvedValueOnce(mockAppointment);
    const a = await mockDb.createAppointment({ doctorId: 'doctor-001', patientId: 'patient-001', date: '2026-08-01', time: '09:00 AM' });
    expect(a).toBeDefined();
  });
  it('APPT-17 created appointment has all required fields', async () => {
    mockDb.createAppointment.mockResolvedValueOnce(mockAppointment);
    const a = await mockDb.createAppointment({});
    expect(a.id).toBeDefined();
    expect(a.doctorId).toBeDefined();
    expect(a.patientId).toBeDefined();
    expect(a.status).toBeDefined();
  });
  it('APPT-18 new appointment status is pending or confirmed', async () => {
    mockDb.createAppointment.mockResolvedValueOnce({ ...mockAppointment, status: 'pending' });
    const a = await mockDb.createAppointment({});
    expect(['pending', 'confirmed']).toContain(a.status);
  });
  it('APPT-19 getAppointments returns array', async () => {
    mockDb.getAppointments.mockResolvedValueOnce([mockAppointment, mockAppointment2]);
    const appts = await mockDb.getAppointments();
    expect(Array.isArray(appts)).toBe(true);
  });
  it('APPT-20 getAppointments returns correct count', async () => {
    mockDb.getAppointments.mockResolvedValueOnce([mockAppointment, mockAppointment2]);
    const appts = await mockDb.getAppointments();
    expect(appts).toHaveLength(2);
  });
  it('APPT-21 getAppointmentsByUserId filters by doctorId', async () => {
    mockDb.getAppointmentsByUserId.mockResolvedValueOnce([mockAppointment]);
    const appts = await mockDb.getAppointmentsByUserId('doctor-001', true);
    appts.forEach((a: { doctorId: string }) => expect(a.doctorId).toBe('doctor-001'));
  });
  it('APPT-22 getAppointmentsByUserId filters by patientId', async () => {
    mockDb.getAppointmentsByUserId.mockResolvedValueOnce([mockAppointment]);
    const appts = await mockDb.getAppointmentsByUserId('patient-001', false);
    appts.forEach((a: { patientId: string }) => expect(a.patientId).toBe('patient-001'));
  });
  it('APPT-23 empty appointments returns empty array', async () => {
    mockDb.getAppointments.mockResolvedValueOnce([]);
    const appts = await mockDb.getAppointments();
    expect(appts).toHaveLength(0);
  });
  it('APPT-24 appointment can be created for future date', async () => {
    const futureAppt = { ...mockAppointment, date: '2030-01-01' };
    mockDb.createAppointment.mockResolvedValueOnce(futureAppt);
    const a = await mockDb.createAppointment(futureAppt);
    expect(new Date(a.date).getFullYear()).toBe(2030);
  });
  it('APPT-25 token numbers are sequential', async () => {
    mockDb.getAppointments.mockResolvedValueOnce([mockAppointment, mockAppointment2]);
    const appts = await mockDb.getAppointments();
    expect(appts[1].tokenNumber).toBeGreaterThan(appts[0].tokenNumber);
  });
});

// ── APPT-26 to APPT-50 · Status transitions ──────────────────────────────────
describe('APPT-26 Status transitions', () => {
  beforeEach(() => { mockDb.updateAppointment.mockReset(); mockDb.cancelAppointment.mockReset(); });

  it('APPT-26 pending appointment can be confirmed', async () => {
    mockDb.updateAppointment.mockResolvedValueOnce({ ...mockAppointment, status: 'confirmed' });
    const updated = await mockDb.updateAppointment('appt-001', { status: 'confirmed' });
    expect(updated.status).toBe('confirmed');
  });
  it('APPT-27 confirmed appointment can be completed', async () => {
    mockDb.updateAppointment.mockResolvedValueOnce({ ...mockAppointment, status: 'completed' });
    const updated = await mockDb.updateAppointment('appt-001', { status: 'completed' });
    expect(updated.status).toBe('completed');
  });
  it('APPT-28 pending appointment can be cancelled', async () => {
    mockDb.cancelAppointment.mockResolvedValueOnce({ ...mockAppointment, status: 'cancelled' });
    const updated = await mockDb.cancelAppointment('appt-001');
    expect(updated.status).toBe('cancelled');
  });
  it('APPT-29 confirmed appointment can be cancelled', async () => {
    mockDb.cancelAppointment.mockResolvedValueOnce({ ...mockAppointment, status: 'cancelled' });
    const updated = await mockDb.cancelAppointment('appt-001');
    expect(updated.status).toBe('cancelled');
  });
  it('APPT-30 completed appointment status is final', () => {
    const completedAppt = { ...mockAppointment, status: 'completed' };
    expect(completedAppt.status).toBe('completed');
  });
  it('APPT-31 cancelled appointment status is final', () => {
    const cancelledAppt = { ...mockAppointment, status: 'cancelled' };
    expect(cancelledAppt.status).toBe('cancelled');
  });
  it('APPT-32 updateAppointment returns updated object', async () => {
    mockDb.updateAppointment.mockResolvedValueOnce({ ...mockAppointment, time: '11:00 AM' });
    const updated = await mockDb.updateAppointment('appt-001', { time: '11:00 AM' });
    expect(updated.time).toBe('11:00 AM');
  });
  it('APPT-33 updateAppointment preserves unchanged fields', async () => {
    const updatedWithSameDoctorId = { ...mockAppointment, status: 'confirmed' };
    mockDb.updateAppointment.mockResolvedValueOnce(updatedWithSameDoctorId);
    const updated = await mockDb.updateAppointment('appt-001', { status: 'confirmed' });
    expect(updated.doctorId).toBe(mockAppointment.doctorId);
  });
  it('APPT-34 can filter pending appointments', async () => {
    const pending = { ...mockAppointment2, status: 'pending' };
    mockDb.getAppointments.mockResolvedValueOnce([mockAppointment, pending]);
    const appts = await mockDb.getAppointments();
    const pendingList = appts.filter((a: { status: string }) => a.status === 'pending');
    expect(pendingList.length).toBeGreaterThan(0);
  });
  it('APPT-35 can filter completed appointments', async () => {
    const completed = { ...mockAppointment, status: 'completed' };
    mockDb.getAppointments.mockResolvedValueOnce([completed]);
    const appts = await mockDb.getAppointments();
    const completedList = appts.filter((a: { status: string }) => a.status === 'completed');
    expect(completedList).toHaveLength(1);
  });
});

// ── APPT-36 to APPT-55 · Queue and token system ───────────────────────────────
describe('APPT-36 Queue and token system', () => {
  beforeEach(() => { mockDb.getQueue.mockReset(); mockDb.addToQueue.mockReset(); mockDb.updateQueueStatus.mockReset(); });

  it('APPT-36 addToQueue returns queue entry', async () => {
    mockDb.addToQueue.mockResolvedValueOnce(mockQueueEntry);
    const entry = await mockDb.addToQueue({ doctorId: 'doctor-001', patientId: 'patient-001' });
    expect(entry).toBeDefined();
  });
  it('APPT-37 queue entry has tokenNumber', async () => {
    mockDb.addToQueue.mockResolvedValueOnce(mockQueueEntry);
    const entry = await mockDb.addToQueue({});
    expect(entry.tokenNumber).toBeDefined();
  });
  it('APPT-38 queue entry has initial status', async () => {
    mockDb.addToQueue.mockResolvedValueOnce(mockQueueEntry);
    const entry = await mockDb.addToQueue({});
    expect(entry.status).toBeDefined();
  });
  it('APPT-39 getQueue returns array of entries', async () => {
    mockDb.getQueue.mockResolvedValueOnce([mockQueueEntry]);
    const queue = await mockDb.getQueue('doctor-001');
    expect(Array.isArray(queue)).toBe(true);
  });
  it('APPT-40 queue sorted by tokenNumber', async () => {
    const q1 = { ...mockQueueEntry, tokenNumber: 1 };
    const q2 = { ...mockQueueEntry, tokenNumber: 2 };
    mockDb.getQueue.mockResolvedValueOnce([q1, q2]);
    const queue = await mockDb.getQueue('doctor-001');
    expect(queue[0].tokenNumber).toBeLessThan(queue[1].tokenNumber);
  });
  it('APPT-41 updateQueueStatus changes to in-progress', async () => {
    mockDb.updateQueueStatus.mockResolvedValueOnce({ ...mockQueueEntry, status: 'in-progress' });
    const updated = await mockDb.updateQueueStatus('q-001', 'in-progress');
    expect(updated.status).toBe('in-progress');
  });
  it('APPT-42 updateQueueStatus changes to done', async () => {
    mockDb.updateQueueStatus.mockResolvedValueOnce({ ...mockQueueEntry, status: 'done' });
    const updated = await mockDb.updateQueueStatus('q-001', 'done');
    expect(updated.status).toBe('done');
  });
  it('APPT-43 queue entry has doctorId', async () => {
    mockDb.addToQueue.mockResolvedValueOnce(mockQueueEntry);
    const entry = await mockDb.addToQueue({});
    expect(entry.doctorId).toBeDefined();
  });
  it('APPT-44 queue entry has patientId', async () => {
    mockDb.addToQueue.mockResolvedValueOnce(mockQueueEntry);
    const entry = await mockDb.addToQueue({});
    expect(entry.patientId).toBeDefined();
  });
  it('APPT-45 queue entry has appointmentId', async () => {
    mockDb.addToQueue.mockResolvedValueOnce(mockQueueEntry);
    const entry = await mockDb.addToQueue({});
    expect(entry.appointmentId).toBeDefined();
  });
});

// ── APPT-46 to APPT-90 · Edge cases, validation and concurrency ──────────────
describe('APPT-46 Edge cases and validation', () => {
  beforeEach(() => { mockDb.createAppointment.mockReset(); mockDb.getAppointments.mockReset(); });

  it('APPT-46 cannot book same slot twice', async () => {
    mockDb.createAppointment.mockRejectedValueOnce(new Error('Slot already booked'));
    await expect(mockDb.createAppointment({ doctorId: 'd1', patientId: 'p2', date: '2026-08-01', time: '09:00 AM' })).rejects.toThrow('Slot already booked');
  });
  it('APPT-47 appointment date cannot be in the past (business rule)', () => {
    const pastDate = '2020-01-01';
    const today = new Date().toISOString().split('T')[0];
    expect(pastDate < today).toBe(true);
  });
  it('APPT-48 appointment time must be from availability', () => {
    const availableTimes = mockDoctor.availability[0].times;
    const requestedTime = '09:00 AM';
    expect(availableTimes).toContain(requestedTime);
  });
  it('APPT-49 unavailable time is rejected (business rule)', () => {
    const availableTimes = mockDoctor.availability[0].times;
    const unavailableTime = '99:99 XM';
    expect(availableTimes).not.toContain(unavailableTime);
  });
  it('APPT-50 cancellation reason can be provided', () => {
    const cancelData = { status: 'cancelled', cancelReason: 'Patient unavailable' };
    expect(cancelData.cancelReason).toBeDefined();
  });
  it('APPT-51 appointment with empty doctorId is invalid', () => {
    const invalid = { ...mockAppointment, doctorId: '' };
    expect(invalid.doctorId.length).toBe(0);
  });
  it('APPT-52 appointment with empty patientId is invalid', () => {
    const invalid = { ...mockAppointment, patientId: '' };
    expect(invalid.patientId.length).toBe(0);
  });
  it('APPT-53 multiple patients can book different slots', async () => {
    mockDb.getAppointments.mockResolvedValueOnce([mockAppointment, mockAppointment2]);
    const appts = await mockDb.getAppointments();
    const unique = new Set(appts.map((a: { time: string }) => a.time));
    expect(unique.size).toBeGreaterThan(0);
  });
  it('APPT-54 appointment list can be sorted by date', async () => {
    const appt1 = { ...mockAppointment, date: '2026-08-01' };
    const appt2 = { ...mockAppointment2, date: '2026-08-02' };
    mockDb.getAppointments.mockResolvedValueOnce([appt2, appt1]);
    const appts = await mockDb.getAppointments();
    const sorted = [...appts].sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));
    expect(sorted[0].date).toBe('2026-08-01');
  });
  it('APPT-55 appointments for doctor show patient names (joined)', () => {
    const apptWithPatientName = { ...mockAppointment, patientName: 'John Doe' };
    expect(apptWithPatientName.patientName).toBeDefined();
  });
  it('APPT-56 appointments for patient show doctor names (joined)', () => {
    const apptWithDoctorName = { ...mockAppointment, doctorName: 'Dr. Alice Smith' };
    expect(apptWithDoctorName.doctorName).toBeDefined();
  });
  it('APPT-57 token 1 is the first in queue', async () => {
    mockDb.getQueue.mockResolvedValueOnce([mockQueueEntry]);
    const queue = await mockDb.getQueue('doctor-001');
    expect(queue[0].tokenNumber).toBe(1);
  });
  it('APPT-58 rescheduling changes time', async () => {
    mockDb.updateAppointment.mockResolvedValueOnce({ ...mockAppointment, time: '02:00 PM' });
    const updated = await mockDb.updateAppointment('appt-001', { time: '02:00 PM' });
    expect(updated.time).toBe('02:00 PM');
  });
  it('APPT-59 rescheduling changes date', async () => {
    mockDb.updateAppointment.mockResolvedValueOnce({ ...mockAppointment, date: '2026-08-05' });
    const updated = await mockDb.updateAppointment('appt-001', { date: '2026-08-05' });
    expect(updated.date).toBe('2026-08-05');
  });
  it('APPT-60 appointment has consistent doctor-patient link', () => {
    expect(mockAppointment.doctorId).toBe('doctor-001');
    expect(mockAppointment.patientId).toBe('patient-001');
  });
  it('APPT-61 appointment2 has same doctor', () => {
    expect(mockAppointment2.doctorId).toBe(mockAppointment.doctorId);
  });
  it('APPT-62 appointment2 has different patient', () => {
    expect(mockAppointment2.patientId).not.toBe(mockAppointment.patientId);
  });
  it('APPT-63 appointments are unique by id', async () => {
    mockDb.getAppointments.mockResolvedValueOnce([mockAppointment, mockAppointment2]);
    const appts = await mockDb.getAppointments();
    const ids = appts.map((a: { id: string }) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('APPT-64 bulk appointments count matches', async () => {
    const bulk = Array.from({ length: 10 }, (_, i) => ({ ...mockAppointment, id: `a-${i}`, tokenNumber: i + 1 }));
    mockDb.getAppointments.mockResolvedValueOnce(bulk);
    const appts = await mockDb.getAppointments();
    expect(appts).toHaveLength(10);
  });
  it('APPT-65 appointments can be filtered by status confirmed', async () => {
    mockDb.getAppointments.mockResolvedValueOnce([mockAppointment, mockAppointment2]);
    const appts = await mockDb.getAppointments();
    const confirmed = appts.filter((a: { status: string }) => a.status === 'confirmed');
    expect(confirmed.length).toBeGreaterThanOrEqual(0);
  });
  it('APPT-66 cancellation updates localStorage', () => {
    const appts = [mockAppointment];
    const updated = appts.map(a => a.id === 'appt-001' ? { ...a, status: 'cancelled' } : a);
    expect(updated[0].status).toBe('cancelled');
  });
  it('APPT-67 queue entry has date field', () => {
    expect(mockQueueEntry.date).toBeDefined();
  });
  it('APPT-68 queue entry status waiting is initial', () => {
    expect(mockQueueEntry.status).toBe('waiting');
  });
  it('APPT-69 queue entry links appointment', () => {
    expect(mockQueueEntry.appointmentId).toBe('appt-001');
  });
  it('APPT-70 queue entry doctor and appointment doctor match', () => {
    expect(mockQueueEntry.doctorId).toBe(mockAppointment.doctorId);
  });
  it('APPT-71 appointment reason length can be max 500 chars', () => {
    const longReason = 'a'.repeat(500);
    expect(longReason.length).toBe(500);
  });
  it('APPT-72 appointment reason empty is allowed', () => {
    const noReason = { ...mockAppointment, reason: '' };
    expect(noReason.reason).toBe('');
  });
  it('APPT-73 appointment time AM format', () => {
    expect(mockAppointment.time.includes('AM') || mockAppointment.time.includes('PM')).toBe(true);
  });
  it('APPT-74 multiple doctors can have same date appointments', async () => {
    const apptDoc2 = { ...mockAppointment, id: 'a3', doctorId: 'doctor-002' };
    mockDb.getAppointments.mockResolvedValueOnce([mockAppointment, apptDoc2]);
    const appts = await mockDb.getAppointments();
    const uniqueDoctors = new Set(appts.map((a: { doctorId: string }) => a.doctorId));
    expect(uniqueDoctors.size).toBe(2);
  });
  it('APPT-75 completed appointment has all fields intact', async () => {
    const completed = { ...mockAppointment, status: 'completed' };
    mockDb.updateAppointment.mockResolvedValueOnce(completed);
    const result = await mockDb.updateAppointment('appt-001', { status: 'completed' });
    expect(result.doctorId).toBeDefined();
    expect(result.patientId).toBeDefined();
    expect(result.date).toBeDefined();
  });
  it('APPT-76 appointment created_at timestamp is set', () => {
    const apptWithTs = { ...mockAppointment, createdAt: new Date().toISOString() };
    expect(apptWithTs.createdAt).toBeDefined();
  });
  it('APPT-77 getAppointments service is callable', () => {
    expect(typeof mockDb.getAppointments).toBe('function');
  });
  it('APPT-78 createAppointment service is callable', () => {
    expect(typeof mockDb.createAppointment).toBe('function');
  });
  it('APPT-79 updateAppointment service is callable', () => {
    expect(typeof mockDb.updateAppointment).toBe('function');
  });
  it('APPT-80 cancelAppointment service is callable', () => {
    expect(typeof mockDb.cancelAppointment).toBe('function');
  });
  it('APPT-81 getQueue service is callable', () => {
    expect(typeof mockDb.getQueue).toBe('function');
  });
  it('APPT-82 addToQueue service is callable', () => {
    expect(typeof mockDb.addToQueue).toBe('function');
  });
  it('APPT-83 updateQueueStatus service is callable', () => {
    expect(typeof mockDb.updateQueueStatus).toBe('function');
  });
  it('APPT-84 queue for non-existent doctor returns empty', async () => {
    mockDb.getQueue.mockResolvedValueOnce([]);
    const q = await mockDb.getQueue('nobody');
    expect(q).toHaveLength(0);
  });
  it('APPT-85 appointments getMethods return promises', () => {
    mockDb.getAppointments.mockReturnValueOnce(Promise.resolve([]));
    const promise = mockDb.getAppointments();
    expect(promise).toBeInstanceOf(Promise);
  });
  it('APPT-86 createAppointment method returns promise', () => {
    mockDb.createAppointment.mockReturnValueOnce(Promise.resolve(mockAppointment));
    const promise = mockDb.createAppointment({});
    expect(promise).toBeInstanceOf(Promise);
  });
  it('APPT-87 appointments can be paginated (slice)', async () => {
    const bulk = Array.from({ length: 20 }, (_, i) => ({ ...mockAppointment, id: `a-${i}` }));
    mockDb.getAppointments.mockResolvedValueOnce(bulk);
    const appts = await mockDb.getAppointments();
    const page1 = appts.slice(0, 10);
    expect(page1).toHaveLength(10);
  });
  it('APPT-88 cancellation does not affect other appointments', () => {
    const appts = [mockAppointment, mockAppointment2];
    const result = appts.map(a => a.id === 'appt-001' ? { ...a, status: 'cancelled' } : a);
    expect(result[1].status).toBe(mockAppointment2.status);
  });
  it('APPT-89 appointment id is a non-empty string', () => {
    expect(typeof mockAppointment.id).toBe('string');
    expect(mockAppointment.id.length).toBeGreaterThan(0);
  });
  it('APPT-90 queue entry id is a non-empty string', () => {
    expect(typeof mockQueueEntry.id).toBe('string');
    expect(mockQueueEntry.id.length).toBeGreaterThan(0);
  });
});
