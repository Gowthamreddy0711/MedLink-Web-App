import { vi } from 'vitest';

// ── Firebase Auth mock responses ─────────────────────────────────────────────
export const mockFirebaseUser = {
  uid: 'firebase-uid-001',
  email: 'test@medlink-test.com',
  emailVerified: false,
  displayName: 'Test User',
  photoURL: null,
  reload: vi.fn().mockResolvedValue(undefined),
};

export const mockFirebaseUserVerified = {
  ...mockFirebaseUser,
  emailVerified: true,
};

export const mockUserCredential = {
  user: mockFirebaseUser,
  providerId: 'password',
  operationType: 'signIn',
};

// ── Firestore document snapshot helpers ─────────────────────────────────────
export const createMockDocSnap = (data: Record<string, unknown> | null, id = 'doc-id') => ({
  id,
  exists: () => data !== null,
  data: () => data,
  ref: { id, path: `collection/${id}` },
});

export const createMockQuerySnap = (items: Record<string, unknown>[]) => ({
  docs: items.map((item, i) =>
    createMockDocSnap(item, (item.id as string) || `doc-${i}`)
  ),
  empty: items.length === 0,
  size: items.length,
  forEach: (cb: (doc: unknown) => void) =>
    items.forEach((item, i) => cb(createMockDocSnap(item, (item.id as string) || `doc-${i}`))),
});

// ── MSW Firebase REST handlers (for fetch-level mocking) ─────────────────────
// These are used when testing code that calls Firebase REST APIs directly
export const FIREBASE_API_KEY = 'AIzaSyA2YF8G6yAsXGVhXE-q-XocUVeOA6vWg-8';
export const FIREBASE_PROJECT = 'medlink-android-app';
export const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;
export const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';

export const firestoreSuccessResponse = (fields: Record<string, unknown> = {}) => ({
  name: `projects/${FIREBASE_PROJECT}/databases/(default)/documents/users/test-id`,
  fields,
  createTime: '2026-01-01T00:00:00Z',
  updateTime: '2026-01-01T00:00:00Z',
});

export const firestoreListResponse = (documents: unknown[] = []) => ({
  documents,
  nextPageToken: undefined,
});

export const authSignInSuccessResponse = {
  kind: 'identitytoolkit#VerifyPasswordResponse',
  localId: 'firebase-uid-001',
  email: 'test@medlink-test.com',
  displayName: '',
  idToken: 'mock-id-token-abc123',
  registered: true,
  refreshToken: 'mock-refresh-token-xyz',
  expiresIn: '3600',
};

export const authSignUpSuccessResponse = {
  kind: 'identitytoolkit#SignupNewUserResponse',
  localId: 'firebase-uid-new',
  email: 'new@medlink-test.com',
  idToken: 'mock-id-token-new',
  refreshToken: 'mock-refresh-new',
  expiresIn: '3600',
};

export const authErrorResponse = (code: string, message: string) => ({
  error: {
    code: 400,
    message,
    errors: [{ message, domain: 'global', reason: code }],
  },
});
