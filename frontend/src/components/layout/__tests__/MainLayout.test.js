import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import MainLayout from '../MainLayout';
import { authService } from '@/services/auth';
import useStore from '@/store/useStore';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/services/auth');
jest.mock('@/store/useStore');

describe('MainLayout', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockStore = {
    user: { name: 'Test User' },
    logout: jest.fn(),
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mocks
    useRouter.mockReturnValue(mockRouter);
    useStore.mockReturnValue(mockStore);
  });

  it('should render logout button and user name', () => {
    render(<MainLayout>Test Content</MainLayout>);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should handle logout when button is clicked', async () => {
    render(<MainLayout>Test Content</MainLayout>);
    
    // Click logout button
    fireEvent.click(screen.getByText('Logout'));
    
    // Verify authService.logout was called
    expect(authService.logout).toHaveBeenCalled();
    
    // Verify store.logout was called
    expect(mockStore.logout).toHaveBeenCalled();
    
    // Verify router.push was called with login path
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('should handle logout errors gracefully', async () => {
    // Mock authService.logout to throw an error
    authService.logout.mockRejectedValueOnce(new Error('Logout failed'));
    
    render(<MainLayout>Test Content</MainLayout>);
    
    // Click logout button
    fireEvent.click(screen.getByText('Logout'));
    
    // Verify store.logout was still called
    expect(mockStore.logout).toHaveBeenCalled();
    
    // Verify router.push was still called
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
}); 