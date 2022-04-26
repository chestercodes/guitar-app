import { test, expect, Page } from '@playwright/test';
import { siteConfigFileName } from '../shared';

const getBaseUrl = () => {
  const baseUrl = process.env.BASE_URL
  if (!baseUrl) {
    throw new Error("Need to specify base url.")
  }
  if (baseUrl.endsWith("/")) {
    return baseUrl
  }
  return `${baseUrl}/`
}

test.beforeEach(async ({ page }) => {
  const baseUrl = getBaseUrl()
  await page.goto(baseUrl);
});

test.describe('Deployment tests', () => {
  test('should have deployed the config file', async ({ page }) => {
    const baseUrl = getBaseUrl()
    const configUrl = `${baseUrl}${siteConfigFileName}`
    await page.goto(configUrl)
    const configJson = await page.locator("pre")
    const json = await configJson.innerText()
    const config = JSON.parse(json)
    const apiBaseUrl = config.apiBaseUrl
    expect(apiBaseUrl).toBeTruthy()
  });

  test('should load the guitars table', async ({ page }) => {
    await page.locator('guitar-table')
  });
});