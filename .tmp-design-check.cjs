const { chromium } = require('C:/Users/tzvlr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const out = 'C:/Users/tzvlr/Downloads/vysefit-design-review';
fs.mkdirSync(out, { recursive: true });
const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'design@example.test', user_metadata: { full_name: 'Revisão visual' }, app_metadata: { provider: 'email' }, created_at: new Date().toISOString() };
const profile = { id: user.id, email: user.email, full_name: 'Revisão visual', plan: 'premium', subscription_plan: 'premium', subscription_status: 'active', profile_setup_completed: true, is_admin: false };
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('http://localhost:3000/auth/login', { timeout: 120000 });
  await page.getByRole('heading', { name: 'Entrar', exact: true }).waitFor({ timeout: 120000 });
  await page.waitForFunction(() => [...document.images].every(i => i.complete));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, 'login-desktop.png'), fullPage: true });
  await context.route('https://*.supabase.co/**', async route => {
    const url = route.request().url();
    const body = url.includes('/auth/v1/user') ? user : url.includes('/profiles') ? profile : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await context.route('**/api/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ plan: 'premium', subscription: { plan: 'premium', status: 'active' }, scansToday: 0, data: [], clans: [] }) }));
  const session = { access_token: 'test-visual-session', refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 36000, expires_at: Math.floor(Date.now()/1000) + 36000, user };
  await context.addCookies([{ name:'sb-leonojbjwlmtcqdhvsgv-auth-token', value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'), domain:'localhost', path:'/' }]);
  await context.addInitScript(() => { localStorage.setItem('onboarding_completed','true'); localStorage.setItem('theme','light'); });
  const views = process.argv.includes('--all') ? ['home','dashboard','training','recipes','planner','food-diary','body','sleep','stress','health-checkin','supplements','meal-planner','dietary','micronutrients','substitutions','periodization','workout-feedback','equipment','mobility','longevity','fasting','biological-age','mood','habits','meditation','seasons','battle-pass','weekly-report','body-evolution','streak-calendar','achievements-page','analytics-charts','smart-reminders','monthly-report','health-integrations','clans','profile','settings','chatbot','corrida'] : ['home','training','dashboard','sleep','settings','recipes'];
  for (const view of views) {
    await page.goto('http://localhost:3000/app?view='+view, { timeout: 120000 });
    await page.locator('.product-topbar').waitFor({ timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => [...document.images].filter(i => i.getBoundingClientRect().top < innerHeight).every(i => i.complete), { timeout: 15000 }).catch(() => {});
    const info = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, text: document.querySelector('main')?.innerText.slice(0,120), overlay: !!document.querySelector('[data-nextjs-dialog]') }));
    console.log(view, JSON.stringify(info));
    if (!process.argv.includes('--all') || ['home','training','dashboard'].includes(view)) await page.screenshot({ path: path.join(out, view+'-desktop.png'), fullPage: false });
  }
  await page.goto('http://localhost:3000/app?view=home');
  await page.getByRole('textbox', { name:'Buscar recurso' }).fill('Sono');
  await page.getByRole('button', { name:'Sono', exact:true }).click();
  await page.getByRole('heading', { name:'Sono', exact:true }).waitFor();
  await page.getByRole('textbox', { name:'Buscar recurso' }).fill('');
  await page.getByRole('button', { name:'Recolher', exact:true }).click();
  console.log('sidebar-collapse', await page.locator('.product-sidebar').getAttribute('data-collapsed'));
  await page.getByRole('button', { name:'Expandir', exact:true }).click();
  await page.evaluate(() => { document.documentElement.classList.remove('light'); document.documentElement.classList.add('dark'); });
  await page.screenshot({ path:path.join(out,'sleep-dark.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/auth/login','/auth/signup','/auth/forgot-password','/subscription','/app?view=home','/app?view=training','/app?view=dashboard']) {
    await page.goto('http://localhost:3000'+route, { timeout: 120000 });
    await page.waitForTimeout(2200);
    console.log('mobile', route, await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, text: document.body.innerText.length })));
    await page.screenshot({ path: path.join(out, route.replace(/[^a-z]/g,'-')+'-mobile.png'), fullPage: false });
  }
  console.log('PAGE_ERRORS', JSON.stringify(errors));
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
