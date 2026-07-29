import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openStory } from './storybook-test-helpers.js';

function createAxeBuilder(page: Page): AxeBuilder {
  return new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21aa',
    'wcag22aa',
  ]);
}

async function analyzeAccessibility(page: Page) {
  try {
    return await createAxeBuilder(page).analyze();
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes('Axe is already running')
    ) {
      throw error;
    }
    await page.waitForFunction(
      () =>
        !(
          window as typeof window & {
            axe?: { _running?: boolean };
          }
        ).axe?._running,
    );
    return createAxeBuilder(page).analyze();
  }
}

for (const story of [
  'screens-loginpage--desktop',
  'screens-loginpage--desktop-light',
  'screens-dashboardpage--empty-dark',
  'screens-dashboardpage--empty-light',
  'screens-dashboardpage--with-fixtures',
  'layouts-appshell--desktop',
  'layouts-appshell--desktop-collapsed',
  'layouts-appshell--mobile',
  'components-dialog--open',
  'components-sheet--open',
  'screens-tasks--tasks-dark',
  'screens-tasks--tasks-light',
  'screens-tasks--empty-dark',
  'screens-tasks--create-dialog',
  'screens-tasks--full-create-dialog',
  'screens-tasks--scheduling-dialog',
  'screens-calendar--month-dark',
  'screens-calendar--month-light',
  'screens-calendar--week-light',
  'screens-calendar--week-dark',
  'screens-calendar--day-dark',
  'screens-calendar--day-light',
  'screens-calendar--selection-mode',
  'screens-calendar--time-grid-regression-day',
  'screens-calendar--time-grid-regression-week',
  'screens-calendar--create-dialog',
  'screens-calendar--quick-create-by-double-click',
  'screens-calendar--all-day-dialog',
  'screens-calendar--bulk-edit-dialog',
  'screens-calendar--bulk-delete-dialog',
  'screens-calendar--edit-travel-dialog',
  'screens-calendar--edit-travel-dialog-light',
  'screens-calendar--travel-estimate',
  'features-scheduling-candidatelist--dark',
  'features-scheduling-candidatelist--light',
  'screens-finance--ledger-light',
  'screens-finance--ledger-dark',
  'screens-finance--expense-dialog',
  'screens-finance-data--import-review-dark',
  'screens-finance-data--import-review-light',
  'screens-finance-data--analytics-dark',
  'screens-finance-data--analytics-light',
  'screens-finance-budgets--budget-states-dark',
  'screens-finance-budgets--budget-states-light',
  'screens-finance-budgets--empty-dark',
  'screens-finance-budgets--create-dialog',
  'screens-finance-budgets--insights-dark',
  'screens-finance-budgets--insights-light',
  'screens-finance-budgets--recurring-dark',
  'screens-finance-budgets--dashboard-light',
  'screens-bucket-list--populated-dark',
  'screens-bucket-list--populated-light',
  'screens-bucket-list--empty-dark',
  'screens-bucket-list--dashboard-light',
  'screens-bucket-list--dashboard-dark',
]) {
  test(`axe WCAG 2.2 AA · ${story}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openStory(page, story);
    const results = await analyzeAccessibility(page);
    expect(results.violations).toEqual([]);
  });
}

test('kalendář termínu je ovladatelný klávesnicí', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'screens-tasks--full-create-dialog');
  const pickerTrigger = page
    .getByRole('dialog')
    .getByRole('button', { name: /^Datum termínu:/ });
  await pickerTrigger.focus();
  await pickerTrigger.press('Enter');
  const calendar = page.getByRole('grid', { name: 'Kalendář termínu' });
  await expect(calendar).toBeVisible();
  const firstDate = calendar.getByRole('gridcell').first();
  await firstDate.focus();
  await firstDate.press('Enter');
  await expect(calendar).toBeHidden();
  await expect(pickerTrigger).not.toHaveText('Vybrat datum');
});

test('dialog vrací focus na spouštěcí tlačítko', async ({ page }) => {
  await openStory(page, 'components-dialog--default');
  const trigger = page.getByRole('button', { name: 'Otevřít dialog' });
  await trigger.focus();
  await trigger.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('skip link vede klávesnici na hlavní obsah', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStory(page, 'layouts-appshell--desktop');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Přejít k hlavnímu obsahu' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('200% text a compact reflow nemají horizontální overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'screens-dashboardpage--empty-dark');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  const hasOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
]) {
  test(`responzivní reflow ${String(viewport.width)} × ${String(viewport.height)}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openStory(page, 'screens-dashboardpage--empty-dark');
    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });
}

test('reduced motion vypne dekorativní animace', async ({ page }) => {
  await openStory(page, 'screens-loginpage--desktop');
  const animation = await page.locator('body').evaluate(() => {
    const probe = document.createElement('span');
    probe.className = 'aurora-skeleton';
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const result = {
      duration: style.animationDuration,
      name: style.animationName,
    };
    probe.remove();
    return result;
  });
  expect(animation.name).toBe('none');
  expect(Number.parseFloat(animation.duration)).toBeLessThanOrEqual(0.00001);
});

test('interaktivní prvky na telefonu mají minimální touch target', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'layouts-appshell--mobile');
  const undersized = await page
    .locator('button:not(:disabled), a')
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          const style = getComputedStyle(element);
          return (
            element.getClientRects().length > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden'
          );
        })
        .map((element) => ({
          label: element.getAttribute('aria-label') ?? element.textContent,
          rect: element.getBoundingClientRect(),
        }))
        .filter(({ rect }) => rect.width < 44 || rect.height < 44)
        .map(({ label }) => label),
    );
  expect(undersized).toEqual([]);
});
