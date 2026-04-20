import { CheckCircle, AlertCircle, Clock } from "lucide-react";

interface SubmissionItemProps {
  title: string;
  status: "ACCEPTED" | "WRONG ANSWER" | "TLE";
  timestamp: string;
  language: string;
}

export function SubmissionItem({
  title,
  status,
  timestamp,
  language,
}: SubmissionItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-emerald-900/30 border-emerald-700/50 text-emerald-300";
      case "WRONG ANSWER":
        return "bg-red-900/30 border-red-700/50 text-red-300";
      case "TLE":
        return "bg-orange-900/30 border-orange-700/50 text-orange-300";
      default:
        return "bg-gray-900/30 border-gray-700/50 text-gray-300";
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-[#2A2A2A] hover:border-[#ffa116]/40 transition-all cursor-pointer group">
      <div className="flex-1">
        <div className="font-medium group-hover:text-[#ffa116] transition">
          {title}
        </div>
        <div className="text-xs text-[#D9C3AD] opacity-60 mt-1">
          {language} • {timestamp}
        </div>
      </div>
      <div
        className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(
          status,
        )}`}
      >
        {status === "ACCEPTED" && <CheckCircle size={14} />}
        {status === "WRONG ANSWER" && <AlertCircle size={14} />}
        {status === "TLE" && <Clock size={14} />}
        {status}
      </div>
    </div>
  );
}
