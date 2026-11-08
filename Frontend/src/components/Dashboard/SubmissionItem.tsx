import { Link } from "react-router-dom";

interface SubmissionItemProps {
  title: string;
  status: string;
  timestamp: string;
  language: string;
  slug?: string;
}

function statusClass(status: string): string {
  const value = status.trim().toLowerCase();
  if (value === "accepted") return "text-secondary";
  if (value === "tle" || value === "time limit exceeded" || value === "wrong answer") {
    return "text-error";
  }
  return "text-on-surface-variant";
}

export function SubmissionItem({ title, status, timestamp, language, slug }: SubmissionItemProps) {
  const href = slug?.trim() ? `/problem/${slug.trim()}` : null;
  const className =
    "flex min-h-11 min-w-0 flex-col gap-2 border border-outline-variant bg-surface-container p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container sm:flex-row sm:items-center sm:justify-between";
  const body = (
    <>
      <div className="min-w-0">
        <p className="break-words text-sm text-on-surface">{title}</p>
        <p className="mt-1 break-words text-sm text-on-surface-variant">
          <span className="font-mono">{language}</span>
          {" · "}
          {timestamp}
        </p>
      </div>
      <p className={`max-w-full break-words font-mono text-xs ${statusClass(status)}`}>{status}</p>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
