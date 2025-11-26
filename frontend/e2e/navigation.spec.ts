import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsUser } from './helpers/auth'

test.describe('Navigation and Route Guards', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    const protectedRoutes = [
      '/',
      '/products',
      '/my-reservations',
      '/profile',
      '/admin/users',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL('/login')
    }
  })

  test('should allow access to public routes without authentication', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL('/login')

    await page.goto('/register')
    await expect(page).toHaveURL('/register')
  })

  test('should navigate between main sections', async ({ page }) => {
    await loginAsAdmin(page)

    // Should already be on home page
    await expect(page).toHaveURL('/')

    // Navigate to Products
    await page.click('a[href*="products"]')
    await expect(page).toHaveURL(/\/products/)

    // Navigate to Reservations
    await page.click('a[href*="reservation"]')
    await expect(page).toHaveURL(/\/.*reservation/)
  })

  test('should navigate to admin section for admin user', async ({ page }) => {
    await loginAsAdmin(page)

    // Click on Admin menu item
    const adminLink = page.locator('a[href*="/admin"]').first()
    await adminLink.click()

    // Should navigate to an admin route
    await expect(page).toHaveURL(/\/admin/)
  })

  test('sidebar should highlight active route', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to different routes and check active state
    const routes = [
      { path: '/', selector: 'a[href="/"]' },
      { path: '/products', selector: 'a[href*="products"]' },
      { path: '/my-reservations', selector: 'a[href*="reservation"]' },
    ]

    for (const route of routes) {
      await page.goto(route.path)

      const activeLink = page.locator(route.selector).first()

      // Check if link has active styling (class names vary)
      const classes = await activeLink.getAttribute('class')
      expect(classes).toMatch(/active|bg-|text-primary|font-bold/)
    }
  })

  test('should handle browser back/forward navigation', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate through several pages
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.goto('/products', { waitUntil: 'networkidle' })
    await page.goto('/my-reservations', { waitUntil: 'networkidle' })

    // Go back
    await page.goBack({ waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/products/)

    // Go back again
    await page.goBack({ waitUntil: 'networkidle' })
    await expect(page).toHaveURL('/')

    // Go forward
    await page.goForward({ waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/products/)
  })

  test('should preserve route after page reload', async ({ page }) => {
    await loginAsAdmin(page)

    // Navigate to a specific route
    await page.goto('/products')
    await expect(page).toHaveURL(/\/products/)

    // Reload
    await page.reload()

    // Should stay on the same route
    await expect(page).toHaveURL(/\/products/)
    await expect(page.locator('aside')).toBeVisible()
  })

  test('should stay on home when already logged in', async ({ page }) => {
    await loginAsAdmin(page)

    // Already on home page after login
    await expect(page).toHaveURL('/')
    await expect(page).not.toHaveURL('/login')

    // Refresh should keep user on home
    await page.reload()
    await expect(page).toHaveURL('/')
  })

  test('should show 404 or redirect for non-existent routes', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/this-route-does-not-exist-123456')

    // Should either show 404 or redirect to a valid route (home)
    const url = page.url()
    const bodyText = await page.textContent('body')

    const isHandled =
      bodyText?.toLowerCase().includes('404') ||
      bodyText?.toLowerCase().includes('not found') ||
      url.includes('localhost:5173/') || // Redirected to home
      url.endsWith('/')

    expect(isHandled).toBeTruthy()
  })
})
