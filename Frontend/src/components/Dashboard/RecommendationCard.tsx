import { Link } from "react-router-dom";

interface RecommendationCardProps {
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
  acceptance: number;
  slug?: string;
}

function difficultyClass(difficulty: string): string {
  switch (difficulty.toUpperCase()) {
    case "EASY":
      return "text-secondary";
    case "MEDIUM":
      return "text-primary-container";
    case "HARD":
      return "text-error";
    default:
      return "text-on-surface-variant";
  }
}

function difficultyText(difficulty: string): string {
  switch (difficulty.toUpperCase()) {
    case "EASY":
      return "Easy";
    case "MEDIUM":
      return "Medium";
    case "HARD":
      return "Hard";
    default:
      return difficulty;
  }
}

export function RecommendationCard({
  title,
  difficulty,
  tags,
  acceptance,
  slug,
}: RecommendationCardProps) {
  const href = slug?.trim() ? `/problem/${slug.trim()}` : null;
  const className =
    "block min-h-11 min-w-0 border border-outline-variant bg-surface-container p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container";
  const body = (
    <>
      <h3 className="break-words text-sm font-medium text-on-surface">{title}</h3>
      <p className={`mt-2 font-mono text-xs ${difficultyClass(difficulty)}`}>
        {difficultyText(difficulty)}
      </p>
      {tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="border border-outline-variant px-2 py-1 text-xs text-on-surface-variant"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-sm text-on-surface-variant">
        <span className="font-mono">{acceptance}%</span> accepted
      </p>
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
