import { vi } from 'vitest';
import { UserRole } from '../../src/types';

// ── Canonical test fixtures ──────────────────────────────────────────────────
export const mockDoctor = {
  id: 'doctor-001',
  role: UserRole.DOCTOR,
  name: 'Dr. Alice Smith',
  email: 'alice@medlink-test.com',
  phone: '+15551234567',
  specialty: 'Cardiology',
  clinicName: 'Heart Care Clinic',
  clinicLocation: '123 Medical Ave, New York',
  bio: 'Board-certified cardiologist with 15 years of experience.',
  rating: 4.8,
  reviewCount: 120,
  isVerified: true,
  photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71f153678e?auto=format&fit=crop&q=80&w=200',
  availability: [
    { date: '2026-08-01', times: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM'] },
    { date: '2026-08-02', times: ['09:00 AM', '10:00 AM', '03:00 PM', '04:00 PM'] },
    { date: '2026-08-03', times: ['11:00 AM', '12:00 PM', '02:00 PM'] },
  ],
};

export const mockDoctor2 = {
  id: 'doctor-002',
  role: UserRole.DOCTOR,
  name: 'Dr. Bob Jones',
  email: 'bob@medlink-test.com',
  phone: '+15559876543',
  specialty: 'Neurology',
  clinicName: 'Brain Health Institute',
  clinicLocation: '456 Health Blvd, Chicago',
  bio: 'Neurologist specializing in migraine and epilepsy.',
  rating: 4.5,
  reviewCount: 89,
  isVerified: true,
  photoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200',
  availability: [
    { date: '2026-08-01', times: ['10:00 AM', '11:00 AM', '02:00 PM'] },
  ],
};

export const mockPatient = {
  id: 'patient-001',
  role: UserRole.PATIENT,
  name: 'John Doe',
  email: 'john@medlink-test.com',
  phone: '+15550001111',
  age: 34,
  bloodGroup: 'O+',
  photoUrl: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200',
};

export const mockPatient2 = {
  id: 'patient-002',
  role: UserRole.PATIENT,
  name: 'Jane Doe',
  email: 'jane@medlink-test.com',
  phone: '+15550002222',
  age: 28,
  bloodGroup: 'A-',
  photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
};

export const mockAppointment = {
  id: 'appt-001',
  doctorId: 'doctor-001',
  patientId: 'patient-001',
  date: '2026-08-01',
  time: '09:00 AM',
  status: 'confirmed' as const,
  tokenNumber: 1,
  reason: 'Annual checkup',
};

export const mockAppointment2 = {
  id: 'appt-002',
  doctorId: 'doctor-001',
  patientId: 'patient-002',
  date: '2026-08-01',
  time: '10:00 AM',
  status: 'pending' as const,
  tokenNumber: 2,
  reason: 'Chest pain',
};

export const mockPrescription = {
  id: 'rx-001',
  appointmentId: 'appt-001',
  doctorId: 'doctor-001',
  patientId: 'patient-001',
  date: '2026-08-01',
  medicines: [
    { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: '30 days' },
    { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '90 days' },
  ],
  instructions: 'Take with food. Follow up in 30 days.',
};

export const mockReview = {
  id: 'rev-001',
  doctorId: 'doctor-001',
  patientId: 'patient-001',
  rating: 5,
  comment: 'Excellent doctor, very thorough and professional.',
  date: '2026-07-15',
};

export const mockReminder = {
  id: 'rem-001',
  patientId: 'patient-001',
  medicineName: 'Aspirin',
  time: '08:00 AM',
  status: 'pending' as const,
  date: '2026-08-01',
};

export const mockLeaveRequest = {
  id: 'leave-001',
  doctorId: 'doctor-001',
  startDate: '2026-08-10',
  endDate: '2026-08-15',
  reason: 'Medical conference attendance',
  status: 'pending' as const,
};

export const mockCoverageRequest = {
  id: 'cov-001',
  fromDoctorId: 'doctor-001',
  toDoctorId: 'doctor-002',
  leaveRequestId: 'leave-001',
  status: 'pending' as const,
};

export const mockNotification = {
  id: 'notif-001',
  userId: 'patient-001',
  title: 'Appointment Confirmed',
  message: 'Your appointment with Dr. Alice Smith on Aug 1 at 9:00 AM is confirmed.',
  type: 'appointment',
  read: false,
  createdAt: '2026-07-25T10:00:00Z',
};

export const mockQueueEntry = {
  id: 'q-001',
  doctorId: 'doctor-001',
  patientId: 'patient-001',
  appointmentId: 'appt-001',
  tokenNumber: 1,
  status: 'waiting' as const,
  date: '2026-08-01',
};

// ── db mock object ────────────────────────────────────────────────────────────
export const mockDb = {
  signup: vi.fn().mockResolvedValue(mockPatient),
  login: vi.fn().mockResolvedValue(mockPatient),
  getUsers: vi.fn().mockResolvedValue([mockDoctor, mockDoctor2, mockPatient, mockPatient2]),
  saveUser: vi.fn().mockResolvedValue(mockPatient),
  getUserById: vi.fn().mockResolvedValue(mockPatient),
  getDoctors: vi.fn().mockResolvedValue([mockDoctor, mockDoctor2]),
  getDoctorById: vi.fn().mockResolvedValue(mockDoctor),
  saveDoctor: vi.fn().mockResolvedValue(mockDoctor),
  getPatients: vi.fn().mockResolvedValue([mockPatient, mockPatient2]),
  getDoctorReviews: vi.fn().mockResolvedValue([mockReview]),
  submitReview: vi.fn().mockResolvedValue(mockReview),
  getAppointments: vi.fn().mockResolvedValue([mockAppointment, mockAppointment2]),
  getAppointmentsByUserId: vi.fn().mockResolvedValue([mockAppointment]),
  createAppointment: vi.fn().mockResolvedValue(mockAppointment),
  updateAppointment: vi.fn().mockResolvedValue({ ...mockAppointment, status: 'confirmed' }),
  cancelAppointment: vi.fn().mockResolvedValue({ ...mockAppointment, status: 'cancelled' }),
  getQueue: vi.fn().mockResolvedValue([mockQueueEntry]),
  addToQueue: vi.fn().mockResolvedValue(mockQueueEntry),
  updateQueueStatus: vi.fn().mockResolvedValue({ ...mockQueueEntry, status: 'in-progress' }),
  getPrescriptions: vi.fn().mockResolvedValue([mockPrescription]),
  createPrescription: vi.fn().mockResolvedValue(mockPrescription),
  getNotifications: vi.fn().mockResolvedValue([mockNotification]),
  createNotification: vi.fn().mockResolvedValue(mockNotification),
  getReminders: vi.fn().mockResolvedValue([mockReminder]),
  createReminder: vi.fn().mockResolvedValue(mockReminder),
  updateReminder: vi.fn().mockResolvedValue({ ...mockReminder, status: 'taken' }),
  getCoverageRequests: vi.fn().mockResolvedValue([mockCoverageRequest]),
  createCoverageRequest: vi.fn().mockResolvedValue(mockCoverageRequest),
  updateCoverageRequest: vi.fn().mockResolvedValue({ ...mockCoverageRequest, status: 'accepted' }),
  sendOtp: vi.fn().mockResolvedValue({ otp: '123456' }),
  verifyOtp: vi.fn().mockReturnValue(true),
  normalizeDoctorAvailability: vi.fn((doc: unknown) => doc),
  seedFirestore: vi.fn().mockResolvedValue(undefined),
  localDb: {
    getItem: vi.fn((key: string, defaultVal: unknown) => defaultVal),
    setItem: vi.fn(),
  },
};

vi.mock('../../src/services/db', () => ({
  db: mockDb,
  localDb: mockDb.localDb,
  seedFirestore: mockDb.seedFirestore,
}));
