import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/store/auth'
import { BrowserRouter } from 'react-router-dom'

vi.mock('@/services/auth')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      }
      const mockAccessToken = 'mock-access-token'

      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        accessToken: mockAccessToken,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      })

      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(true)
        expect(useAuthStore.getState().user).toEqual(mockUser)
        expect(useAuthStore.getState().accessToken).toBe(mockAccessToken)
      })
    })

    it('should handle login error', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await expect(
        result.current.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow()

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
      }
      const mockAccessToken = 'mock-access-token'

      vi.mocked(authService.register).mockResolvedValue({
        user: mockUser,
        accessToken: mockAccessToken,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await result.current.register({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      })

      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(true)
        expect(useAuthStore.getState().user).toEqual(mockUser)
      })
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Setup authenticated state
      useAuthStore.getState().login(
        { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
        'token'
      )

      vi.mocked(authService.logout).mockResolvedValue()

      const { result } = renderHook(() => useAuth(), { wrapper })

      await result.current.logout()

      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false)
        expect(useAuthStore.getState().user).toBeNull()
        expect(useAuthStore.getState().accessToken).toBeNull()
      })
    })
  })
})