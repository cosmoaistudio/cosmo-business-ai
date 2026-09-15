import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

interface SortableListProps<T> {
  items: T[];
  getKey: (item: T, index: number) => string;
  onReorder: (fromIndex: number, toIndex: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
}

export default function SortableList<T>({
  items,
  getKey,
  onReorder,
  renderItem,
  emptyMessage = "Nenhum item.",
}: SortableListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={getKey(item, index)}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("text/plain", String(index));
            event.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            const fromIndex = Number(event.dataTransfer.getData("text/plain"));
            onReorder(fromIndex, index);
          }}
          className="flex cursor-grab items-start gap-3 active:cursor-grabbing"
        >
          <div className="mt-3 shrink-0 text-slate-400">
            <GripVertical size={18} />
          </div>
          <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
        </div>
      ))}
    </div>
  );
}
