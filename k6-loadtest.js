import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString, randomIntBetween } from 'k6/crypto';

export const options = {

  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.05'],
    'http_req_duration{scenario:submitting}': ['p(95)<2500'],
  },


  scenarios: {
    browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 250 },
        { duration: '30s', target: 250 },
        { duration: '10s', target: 0 },
      ],
      exec: 'browsingUserBehavior',
    },

    submitting: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '10s', target: 0 },
      ],
      exec: 'submittingUserBehavior',
    },

    logged_in: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 150 },
        { duration: '30s', target: 150 },
        { duration: '10s', target: 0 },
      ],
      exec: 'loggedInUserBehavior',
    },
  },
};

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');



export function browsingUserBehavior() {
  const routes = [
    '/problems', 
    '/problems/two-sum', 
    '/problems/daily-challenge', 
    '/health'
  ];
  
  const randomRoute = routes[Math.floor(Math.random() * routes.length)];
  const res = http.get(`${BASE_URL}${randomRoute}`);

  check(res, {
    'browsing status is 200': (r) => r.status === 200 || r.status === 404,
  });

  sleep(randomIntBetween(1, 3));
}

export function submittingUserBehavior() {
  const payload = JSON.stringify({
    code: `console.log("Hello ${randomString(5)}");`,
    language: 'javascript',
    problemId: 'two-sum',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/submissions`, payload, params);

  check(res, {
    'submission successful': (r) => r.status === 200 || r.status === 201,
  });

  sleep(randomIntBetween(3, 7));
}

export function loggedInUserBehavior() {
  const loginPayload = JSON.stringify({
    email: `test_user_${randomIntBetween(1, 1000)}@example.com`,
    password: `password${randomString(6)}`,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
  
  check(loginRes, {
    'auth endpoint reachable': (r) => r.status !== 500,
  });

  const historyRes = http.get(`${BASE_URL}/submissions`);
  
  check(historyRes, {
    'history fetched': (r) => r.status === 200 || r.status === 401,
  });

  sleep(randomIntBetween(1, 4));
}
