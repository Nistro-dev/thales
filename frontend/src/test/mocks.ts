import { vi } from 'vitest'

vi.mock('zustand/middleware', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  persist: (config: any) => config,
}))

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  }
})