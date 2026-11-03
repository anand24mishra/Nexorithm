import { test, expect } from '@playwright/test';
// Browser contract tests stub the HTTP boundary; they do not certify sandbox execution.
const problem = { id: '1', slug: 'two-sum', title: 'Two Sum', difficulty: 'easy', content: '<p>Find two numbers.</p>', tags: ['Array'], hints: [], testCases: [], acRate: 50, starterCode: {javascript:'function twoSum(nums,target) { return [0,1]; }',python:'class Solution:\n    def twoSum(self, nums, target):\n        return [0,1]'}, sampleInput:'[2,7]\n9',sampleOutput:'[0,1]' };
for (const verdict of ['Accepted','Wrong Answer','Time Limit Exceeded']) test(`login, submit, poll and history: ${verdict}`, async ({ page }) => {
  let posts=0, reads=0;
  const row = {id:'a'.repeat(24),problemId:'1',language:'javascript',code:problem.starterCode.javascript,verdict,passedTestCases:verdict==='Accepted'?1:0,totalTestCases:1,executionTimeMs:12,submittedAt:new Date().toISOString(),status:'completed',result:{verdict,passedCount:verdict==='Accepted'?1:0,totalCount:1,stdout:'',stderr:'',results:[],executionTimeMs:12}};
  await page.route('**/api/**', async route => {
    const url=new URL(route.request().url());
    if(url.pathname==='/api/auth/login') return route.fulfill({json:{token:'test-token',user:{username:'tester',id:'owner'}}});
    if(url.pathname==='/api/problems/two-sum') return route.fulfill({json:problem});
    if(url.pathname==='/api/problems') return route.fulfill({json:{problems:[problem],total:1,page:1,totalPages:1}});
    if(url.pathname==='/api/submissions' && route.request().method()==='POST'){posts++;return route.fulfill({status:202,json:{submissionId:row.id,status:'queued'}});}
    if(url.pathname===`/api/submissions/${row.id}`){reads++;return route.fulfill({json:reads<3?{...row,status:reads===1?'queued':'running',verdict:null,result:undefined}:row});}
    if(url.pathname.startsWith('/api/submissions'))return route.fulfill({json:{submissions:[row],total:1,page:1,totalPages:1}});
    return route.fulfill({json:{stats:{},activityData:[],recentSubmissions:[],recommendations:[]}});
  });
  await page.goto('/login');await page.getByLabel('Email',{exact:true}).fill('test@example.com');await page.getByLabel('Password',{exact:true}).fill('password123');await page.getByRole('button',{name:'Sign In',exact:true}).click();
  await page.goto('/problem/two-sum');await expect(page.locator('.monaco-editor').first()).toBeVisible();
  await page.getByRole('button',{name:/Submit/,exact:false}).first().click();
  await expect(page.getByRole('status')).toContainText('Queued');
  await expect(page.getByRole('status')).toContainText('Running',{timeout:10000});
  await expect(page.locator('.verdict-badge')).toContainText(verdict,{timeout:15000});
  expect(posts).toBe(1);expect(reads).toBe(3);
  await page.getByRole('button',{name:'history Submits',exact:true}).click();await expect(page.getByRole('heading',{name:'Submission Records'})).toBeVisible();
  await expect(page.getByRole('cell',{name:verdict}).first()).toBeVisible();
  if(verdict==='Accepted') { await page.screenshot({path:'test-results/workspace-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/workspace-mobile.png',fullPage:true}); }
});
test('worker status service unavailable offers status retry', async ({page}) => {
  await page.route('**/api/**', async route=>{
    const url=new URL(route.request().url());
    if(url.pathname==='/api/problems/two-sum')return route.fulfill({json:problem});
    if(url.pathname==='/api/problems')return route.fulfill({json:{problems:[problem],total:1,page:1,totalPages:1}});
    if(route.request().method()==='POST')return route.fulfill({status:202,json:{submissionId:'a'.repeat(24),status:'queued'}});
    return route.fulfill({status:503,json:{error:'unavailable'}});
  });
  await page.goto('/problem/two-sum');await page.getByRole('button',{name:/Submit/}).first().click();
  await expect(page.getByRole('status')).toContainText('Status unavailable',{timeout:20000});await expect(page.getByRole('button',{name:'Retry status'})).toBeVisible();
});
