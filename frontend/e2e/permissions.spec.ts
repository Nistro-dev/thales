import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsUser } from './helpers/auth'

test.describe('Permission-based Access Control', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('admin should see admin menu in sidebar', async ({ page }) => {
    await loginAsAdmin(page)

    // Check that Admin section is visible in sidebar
    const sidebar = page.locator('aside')
    await expect(sidebar).toContainText(/admin/i)

    // Check for common admin menu items
    await expect(sidebar.locator('a[href*="/admin"]')).toBeVisible()
  })

  test('regular user should NOT see admin menu', async ({ page }) => {
    await loginAsUser(page)

    // Admin section should not be visible
    const sidebar = page.locator('aside')

    // Check that there's no admin link
    const adminLinks = sidebar.locator('a[href*="/admin"]')
    await expect(adminLinks).toHaveCount(0)
  })

  test('admin should be able to access admin routes', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to admin routes
    const adminRoutes = ['/admin/users', '/admin/roles', '/admin/sections']

    for (const route of adminRoutes) {
      await page.goto(route)

      // Should not redirect to forbidden or login
      await expect(page).not.toHaveURL('/login')
      await expect(page).not.toHaveURL(/forbidden|403/i)

      // Should show the route content (not error page)
      await expect(page.locator('h1, h2')).not.toContainText(/accès refusé|forbidden|403/i)
    }
  })

  test('regular user should be blocked from admin routes', async ({ page }) => {
    await loginAsUser(page)

    // Try to access admin route
    await page.goto('/admin/users')

    // Should be redirected or show forbidden message
    const url = page.url()
    const content = await page.textContent('body')

    const isBlocked =
      url.includes('/login') ||
      url.includes('forbidden') ||
      content?.toLowerCase().includes('accès refusé') ||
      content?.toLowerCase().includes('forbidden')

    expect(isBlocked).toBeTruthy()
  })

  test('admin should have all permissions from Super Admin role', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to dashboard
    await page.goto('/dashboard')

    const sidebar = page.locator('aside')

    // Check that admin has access to all main sections
    await expect(sidebar.locator('a[href="/dashboard"]')).toBeVisible()
    await expect(sidebar.locator('a[href*="reservations"]')).toBeVisible()
    await expect(sidebar.locator('a[href*="products"]')).toBeVisible()
    await expect(sidebar.locator('a[href*="admin"]')).toBeVisible()
  })

  test('should show correct user info with credits and roles', async ({ page }) => {
    await loginAsAdmin(page)

    const sidebar = page.locator('aside')

    // Check user name
    await expect(sidebar).toContainText('Admin System')

    // Check credits display
    await expect(sidebar).toContainText(/1000.*crédits?|crédits?.*1000/i)
  })

  test('multiple roles should grant combined permissions', async ({ page }) => {
    await loginAsAdmin(page)

    // Admin has both "User" and "Super Admin" roles
    // Should have permissions from BOTH roles

    // Navigate to different sections to verify access
    const routes = ['/dashboard', '/products', '/reservations', '/admin/users']

    for (const route of routes) {
      await page.goto(route)
      await expect(page).not.toHaveURL('/login')

      // Should not show access denied
      const bodyText = await page.textContent('body')
      expect(bodyText?.toLowerCase()).not.toContain('accès refusé')
      expect(bodyText?.toLowerCase()).not.toContain('forbidden')
    }
  })
})
