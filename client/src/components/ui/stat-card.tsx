import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: string;
  iconColor?: "primary" | "accent" | "success" | "warning" | "error" | "secondary";
  label: string;
  value: string | number;
  isLoading?: boolean;
}

export default function StatCard({
  icon,
  iconColor = "primary",
  label,
  value,
  isLoading = false,
}: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary-light bg-opacity-10 text-primary",
    secondary: "bg-secondary-light bg-opacity-10 text-secondary",
    accent: "bg-accent-light bg-opacity-10 text-accent",
    success: "bg-success bg-opacity-10 text-success",
    warning: "bg-warning bg-opacity-10 text-warning",
    error: "bg-error bg-opacity-10 text-error",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex items-center">
      <div className={cn("rounded-full p-3 mr-4", colorClasses[iconColor])}>
        <span className="material-icons">{icon}</span>
      </div>
      <div>
        <p className="text-sm text-neutral-600">{label}</p>
        {isLoading ? (
          <Skeleton className="h-6 w-16 mt-1" />
        ) : (
          <p className="text-xl font-bold">{value}</p>
        )}
      </div>
    </div>
  );
}
