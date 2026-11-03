import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
const base = __ENV.BASE_URL || 'http://127.0.0.1:8000';
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base) && __ENV.ALLOW_STAGING !== '1') throw new Error('Local target required; explicitly authorize a staging target before ALLOW_STAGING=1');
const vus = Number(__ENV.VUS || 10);
if (![10,50,100,250,500].includes(vus)) throw new Error('VUS must be 10,50,100,250,500');
const mode = __ENV.MODE || 'reads';
const completed = new Counter('judge_completed'), enqueued = new Counter('judge_enqueued');
const queueWait = new Trend('judge_queue_wait_ms'), execution = new Trend('judge_execution_ms');
export const options = { vus, duration: __ENV.DURATION || '30s', rps: Number(__ENV.RPS || 10), thresholds: { http_req_failed: ['rate<0.01'] } };
export default function () {
  if (mode === 'reads' || (mode === 'mixed' && Math.random() < .8)) {
    check(http.get(`${base}/api/problems?page=1&limit=20`), { 'read OK': r=>r.status === 200 }); sleep(1); return;
  }
  if (!__ENV.TOKEN) throw new Error('Provide a staging test-user TOKEN');
  const headers = { Authorization: `Bearer ${__ENV.TOKEN}`, 'Content-Type': 'application/json' };
  const response = http.post(`${base}/api/submissions`, JSON.stringify({ problemId: __ENV.PROBLEM_ID || '1', language: 'javascript', code: 'function twoSum(nums,target){const seen=new Map();for(let i=0;i<nums.length;i++){if(seen.has(target-nums[i]))return [seen.get(target-nums[i]),i];seen.set(nums[i],i)}}' }), { headers });
  if (!check(response, { 'queued': r => r.status === 202 })) { sleep(6); return; }
  enqueued.add(1);
  if (mode !== 'enqueue') {
    const id = response.json('submissionId');
    for (let i=0; i<60; i++) {
      sleep(1.5); const result = http.get(`${base}/api/submissions/${id}`, { headers });
      if (result.status !== 200) continue;
      const row = result.json();
      if (['completed','failed','cancelled'].includes(row.status)) { completed.add(1); queueWait.add(row.queueWaitMs || 0); execution.add(row.executionTimeMs || 0); check(row,{ 'judge accepted': r=>r.verdict === 'Accepted' }); break; }
    }
  }
  sleep(6); // Respect default per-user submission admission. Use multiple test users for saturation studies.
}
