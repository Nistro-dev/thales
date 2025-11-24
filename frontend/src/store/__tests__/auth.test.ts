import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should login and set user and token', () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    }
    const mockToken = 'mock-access-token'

    act(() => {
      result.current.login(mockUser, mockToken)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.accessToken).toBe(mockToken)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should set user', () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    }

    act(() => {
      result.current.setUser(mockUser)
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('should set access token', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setAccessToken('new-token')
    })

    expect(result.current.accessToken).toBe('new-token')
  })

  it('should logout and clear state', () => {
    const { result } = renderHook(() => useAuthStore())

    // First login
    act(() => {
      result.current.login(
        {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
        'token'
      )
    })

    expect(result.current.isAuthenticated).toBe(true)

    // Then logout
    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})