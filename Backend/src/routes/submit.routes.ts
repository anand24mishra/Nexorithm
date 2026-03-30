import { Router, Request, Response } from 'express';
import { ExecutorFactory } from '../services/executorFactory';
import { mockProblems } from '../db/mockProblems';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { problemId, language, code } = req.body;

  if (!problemId || !language || !code)
    return res.status(400).json({ error: 'Missing fields: problemId, language, code' });

  const problem = mockProblems.find((p) => p.id === problemId);
  if (!problem)
    return res.status(404).json({ error: `Problem "${problemId}" not found` });

  let passedCount = 0;
  let finalVerdict = 'Accepted';
  let failureDetail = '';

  for (let i = 0; i < problem.testCases.length; i++) {
    const testCase = problem.testCases[i];

    try {
      // FACTORY: creates the right runner, runs the code
      const executor = ExecutorFactory.getExecutor(language);
      const actualOutput = await executor.execute(code, testCase.input);

      if (actualOutput === testCase.expectedOutput.trim()) {
        passedCount++; 
      } else {
        finalVerdict = 'Wrong Answer';
        failureDetail = `Test ${i+1}: Expected "${testCase.expectedOutput}", got "${actualOutput}"`;
        break;
      }
    } catch (error: any) {
      if (error.signal === 'SIGTERM' || error.killed) {
        finalVerdict = 'Time Limit Exceeded';
        failureDetail = `Test ${i+1} exceeded 2-second limit.`;
      } else {
        finalVerdict = 'Runtime Error';
        failureDetail = error.stderr?.trim() || error.message;
      }
      break;
    }
  }

  return res.json({
    status: 'completed',
    verdict: finalVerdict,
    passed: passedCount,
    total: problem.testCases.length,
    detail: failureDetail,
  });
});

export default router;