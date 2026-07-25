import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/patient', state: null, search: '', hash: '' }),
    useParams: () => ({}),
  };
});

vi.mock('../../src/services/db', () => ({
  db: {
    getDoctors: vi.fn().mockResolvedValue([]),
    getAppointmentsByUserId: vi.fn().mockResolvedValue([]),
    getPrescriptions: vi.fn().mockResolvedValue([]),
  },
  seedFirestore: vi.fn(),
  localDb: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
  },
}));

import SplashScreen from '../../src/pages/auth/SplashScreen';
import GetStartedScreen from '../../src/pages/auth/GetStartedScreen';
import RoleSelectionScreen from '../../src/pages/auth/RoleSelectionScreen';
import MainLayout from '../../src/components/layout/MainLayout';
import SearchDoctors from '../../src/pages/patient/SearchDoctors';
import { db } from '../../src/services/db';
import { ROUTES } from '../../src/constants';
import { UserRole } from '../../src/types';

describe('Component rendering and user flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the splash screen headline', () => {
    render(<SplashScreen />);
    expect(screen.getByText(/Smart Doctor Network/i)).toBeInTheDocument();
  });

  it('renders Get Started screen and calls navigate on CTA', async () => {
    render(
      <MemoryRouter>
        <GetStartedScreen />
      </MemoryRouter>
    );
    const button = screen.getByRole('button', { name: /Get Started/i });
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.ROLE_SELECTION);
  });

  it('renders Role Selection screen and navigates to login for doctor', async () => {
    render(
      <MemoryRouter>
        <RoleSelectionScreen />
      </MemoryRouter>
    );

    // Use role-card title specifically — there are multiple elements containing "Doctor"
    // (description text, heading, etc.) so we target the heading inside the card
    const doctorButtons = screen.getAllByText(/Doctor/i);
    // The role card button's heading h3 is the first element with exactly "Doctor"
    const doctorHeading = doctorButtons.find(el => el.tagName === 'H3');
    expect(doctorHeading).toBeInTheDocument();

    // Click the role card (button) that contains the Doctor heading
    const roleCard = doctorHeading!.closest('button');
    expect(roleCard).toBeInTheDocument();
    await userEvent.click(roleCard!);
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.LOGIN, { state: { role: UserRole.DOCTOR } });
  });

  it('renders patient MainLayout navigation items', () => {
    render(
      <MemoryRouter>
        <MainLayout user={{ id: 'patient-001', name: 'Patient User', role: UserRole.PATIENT, photoUrl: '' }} />
      </MemoryRouter>
    );
    // The sidebar "Find Doctors" link (desktop) — at least one must exist
    expect(screen.getAllByText(/Find Doctors/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Home/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText(/Open settings/i)).toBeInTheDocument();
  });

  it('opens and closes the mobile menu in MainLayout', async () => {
    render(
      <MemoryRouter>
        <MainLayout user={{ id: 'patient-001', name: 'Patient User', role: UserRole.PATIENT, photoUrl: '' }} />
      </MemoryRouter>
    );

    // There may be multiple toggle buttons (sidebar + header), pick the first visible one
    const toggleButtons = screen.getAllByRole('button', { name: /Toggle navigation menu/i });
    expect(toggleButtons.length).toBeGreaterThanOrEqual(1);

    await userEvent.click(toggleButtons[0]);
    // After opening, a Close menu button should appear
    const closeBtn = await screen.findByRole('button', { name: /Close menu/i });
    expect(closeBtn).toBeInTheDocument();

    await userEvent.click(closeBtn);
    expect(mockNavigate).not.toHaveBeenCalledWith(ROUTES.PATIENT_SEARCH);
  });

  it('renders SearchDoctors page and loads doctors through db service', async () => {
    render(
      <MemoryRouter>
        <SearchDoctors />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/Search.../i)).toBeInTheDocument();
    await waitFor(() => expect(db.getDoctors).toHaveBeenCalled());
    // Multiple elements may contain "Find Doctors" — just assert at least one exists
    expect(screen.getAllByText(/Find Doctors/i).length).toBeGreaterThanOrEqual(1);
  });
});
