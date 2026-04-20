import { Zap } from "lucide-react";

interface RecommendationCardProps {
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
  acceptance: number;
}

export function RecommendationCard({
  title,
  difficulty,
  tags,
  acceptance,
}: RecommendationCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "text-emerald-400";
      case "MEDIUM":
        return "text-[#ffa116]";
      case "HARD":
        return "text-red-400";
      default:
        return "text-[#D9C3AD] opacity-70";
    }
  };

  return (
    <div className="p-4 bg-black/30 rounded-lg border border-[#2A2A2A] hover:border-[#ffa116]/40 transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium group-hover:text-[#ffa116] transition leading-snug text-sm">
          {title}
        </h3>
      </div>
      <div
        className={`text-xs font-bold mb-3 ${getDifficultyColor(difficulty)}`}
      >
        {difficulty}
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-[#ffa116]/10 border border-[#ffa116]/30 text-[#D9C3AD] text-xs rounded"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="text-xs text-[#D9C3AD] opacity-60">
        <Zap size={12} className="inline mr-1" />
        {acceptance}% success
      </div>
    </div>
  );
}
