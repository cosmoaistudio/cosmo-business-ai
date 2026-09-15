import { SkeletonTable } from "@/motion";

interface TableLoadingStateProps {
  rows?: number;
  label?: string;
}

export default function TableLoadingState({
  rows = 5,
  label = "Carregando dados",
}: TableLoadingStateProps) {
  return <SkeletonTable rows={rows} label={label} />;
}
