import { Verdict } from '../../types';

const verdictConfig: Record<string, { className: string; icon: string }> = {
  [Verdict.ACCEPTED]: { className: 'verdict-accepted', icon: '✓' },
  [Verdict.WRONG_ANSWER]: { className: 'verdict-wrong', icon: '✗' },
  [Verdict.RUNTIME_ERROR]: { className: 'verdict-runtime', icon: '⚠' },
  [Verdict.TIME_LIMIT_EXCEEDED]: { className: 'verdict-tle', icon: '⏱' },
  Queued: { className: 'verdict-tle', icon: '…' },
  Running: { className: 'verdict-tle', icon: '…' },
  [Verdict.MEMORY_LIMIT_EXCEEDED]: { className: 'verdict-runtime', icon: '⚠' },
  [Verdict.OUTPUT_LIMIT_EXCEEDED]: { className: 'verdict-runtime', icon: '⚠' },
  [Verdict.SYSTEM_ERROR]: { className: 'verdict-runtime', icon: '⚠' },
  [Verdict.CANCELLED]: { className: 'verdict-runtime', icon: '–' },
  [Verdict.COMPILE_ERROR]: { className: 'verdict-wrong', icon: '⚠' },
};

interface Props {
  verdict: Verdict | string;
  animate?: boolean;
}

export function VerdictBadge({ verdict }: Props) {
  const config = verdictConfig[verdict] || verdictConfig[Verdict.WRONG_ANSWER];
  return (
    <span className={`verdict-badge ${config.className}`}>
      <span>{config.icon}</span>
      {verdict}
    </span>
  );
}
