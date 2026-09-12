import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from '@playwright/test';

const homePageUrl = pathToFileURL(
  path.resolve(__dirname, '../src/index.html'),
).toString();

test('test', async ({ page }) => {
  await page.goto(homePageUrl);
  await page.getByRole('link', { name: 'Get in touch' }).click();
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'View the source' }).click();
  const page1 = await page1Promise;
  const page2Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'LinkedIn' }).click();
  const page2 = await page2Promise;
  const page3Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'System Shogun' }).click();
  const page3 = await page3Promise;
  await page.getByRole('link', { name: 'About' }).click();
  await page.getByRole('link', { name: 'Certifications' }).click();
  const page4Promise = page.waitForEvent('popup');
  await page
    .getByRole('link', {
      name: 'View certification details',
      description: 'Frontier Transformation Engineer',
    })
    .click();
  const page4 = await page4Promise;
  const page5Promise = page.waitForEvent('popup');
  await page
    .getByRole('link', {
      name: 'View certification details',
      description:
        'Microsoft Certified: Agentic AI Business Solutions Architect',
    })
    .click();
  const page5 = await page5Promise;
  const page6Promise = page.waitForEvent('popup');
  await page
    .getByRole('link', {
      name: 'View certification details',
      description: 'Microsoft Certified: Azure Solutions Architect Expert',
    })
    .click();
  const page6 = await page6Promise;
  const page7Promise = page.waitForEvent('popup');
  await page
    .getByRole('link', {
      name: 'View certification details',
      description: 'Microsoft Certified: DevOps Engineer Expert',
    })
    .click();
  const page7 = await page7Promise;
  const page8Promise = page.waitForEvent('popup');
  await page
    .getByRole('link', {
      name: 'View certification details',
      description:
        'Microsoft Certified: Azure AI Apps and Agents Developer Associate',
    })
    .click();
  const page8 = await page8Promise;
  const page9Promise = page.waitForEvent('popup');
  await page
    .getByRole('link', {
      name: 'View certification details',
      description: 'Microsoft Certified: Azure Developer Associate',
    })
    .click();
  const page9 = await page9Promise;
  const page10Promise = page.waitForEvent('popup');
  await page
    .getByRole('link', {
      name: 'View certification details',
      description: 'Microsoft Certified: Azure Administrator Associate',
    })
    .click();
  const page10 = await page10Promise;
  const page11Promise = page.waitForEvent('popup');
  await page
    .getByRole('link', {
      name: 'View certification details',
      description: 'Microsoft Certified: Azure AI Fundamentals',
    })
    .click();
  const page11 = await page11Promise;
  const page12Promise = page.waitForEvent('popup');
  await page
    .getByRole('link', {
      name: 'View certification details',
      description: 'Microsoft Certified: Azure Fundamentals',
    })
    .click();
  const page12 = await page12Promise;
  const page13Promise = page.waitForEvent('popup');
  await page
    .getByRole('link', {
      name: 'View certification details',
      description: 'GitHub Copilot',
    })
    .click();
  const page13 = await page13Promise;
});
