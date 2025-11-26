import { Page } from '@playwright/test'

export const TEST_USERS = {
  admin: {
    email: 'admin@thales.local',
    password: 'Admin123!',
  },
  user: {
    email: 'user@thales.local',
    password: 'User123!',
  },
}

/**
 * Login helper function
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  // Wait for navigation after login (redirects to home "/")
  await page.waitForURL('/', { timeout: 15000 })
}

/**
 * Login as admin
 */
export async function loginAsAdmin(page: Page) {
  await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password)
}

/**
 * Login as regular user
 */
export async function loginAsUser(page: Page) {
  await login(page, TEST_USERS.user.email, TEST_USERS.user.password)
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  await page.click('button:has-text("Déconnexion"), button:has-text("Logout")')
  await page.waitForURL('/login')
}

/**
 * Check if user is logged in by checking for user info in sidebar
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('aside', { timeout: 3000 })
    return true
  } catch {
    return false
  }
}
