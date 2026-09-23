import { useCallback, useEffect, useRef, useState } from "react";
import type { DigitalStoreSettings } from "../../../types/digitalStore.types";
import type { MenuEditorSectionId } from "./menuEditor.types";

const HISTORY_LIMIT = 40;

export interface EditorHistoryOp {
  section?: MenuEditorSectionId;
  field?: string;
  previous: Partial<DigitalStoreSettings>;
  next: Partial<DigitalStoreSettings>;
}

/**
 * Field-level undo with snapshot fallback for the current editor draft.
 */
export function useEditorHistory(
  settings: DigitalStoreSettings,
  onChange: (patch: Partial<DigitalStoreSettings>) => void
) {
  const pastRef = useRef<EditorHistoryOp[]>([]);
  const settingsRef = useRef(settings);
  const [historySize, setHistorySize] = useState(0);
  settingsRef.current = settings;

  const pushAndPatch = useCallback(
    (patch: Partial<DigitalStoreSettings>, meta?: { section?: MenuEditorSectionId; field?: string }) => {
      const previous: Partial<DigitalStoreSettings> = {};
      (Object.keys(patch) as Array<keyof DigitalStoreSettings>).forEach((key) => {
        previous[key] = settingsRef.current[key] as never;
      });

      pastRef.current = [
        ...pastRef.current.slice(-(HISTORY_LIMIT - 1)),
        {
          section: meta?.section,
          field: meta?.field,
          previous,
          next: patch,
        },
      ];
      setHistorySize(pastRef.current.length);
      onChange(patch);
    },
    [onChange]
  );

  const undo = useCallback(() => {
    const op = pastRef.current.pop();
    if (!op) return false;
    setHistorySize(pastRef.current.length);
    onChange(op.previous);
    return true;
  }, [onChange]);

  const clear = useCallback(() => {
    pastRef.current = [];
    setHistorySize(0);
  }, []);

  const canUndo = historySize > 0;
  const lastOp = pastRef.current[pastRef.current.length - 1] ?? null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!(event.ctrlKey || event.metaKey) || key !== "z" || event.shiftKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (pastRef.current.length === 0) return;
      event.preventDefault();
      undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  return { pushAndPatch, undo, clear, canUndo, historySize, lastOp };
}
