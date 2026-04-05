import type { SubmissionResult } from '../types';
import { Language } from '../types';

import { fetchWithAuth } from './authApi';

export const submissionApi = {
  async submit(
    code: string,
    language: Language,
    problemId: string
  ): Promise<SubmissionResult> {
    const res = await fetchWithAuth(`/submissions`, {
      method: 'POST',
      body: JSON.stringify({ code, language, problemId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Submission failed' }));
      throw new Error(err.error || `Submission failed: ${res.status}`);
    }
    return res.json();
  },
};
