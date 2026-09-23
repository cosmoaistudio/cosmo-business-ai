import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  computeSectionScrollTop,
  measureScrollMarker,
  measureStickyNavOffset,
  menuSectionAnchorId,
  pickActiveMenuSection,
  readElementScale,
  resolveMenuScrollContainer,
} from "../core/menuSectionNav";

interface UseMenuSectionNavParams {
  enabled: boolean;
  sectionIds: string[];
  scrollContainerRef?: RefObject<HTMLElement | null>;
}

/**
 * Section navigation + scroll-spy. Uses the real overflow container
 * (preview canvas or window) — never assumes window is the scroller.
 */
export function useMenuSectionNav({
  enabled,
  sectionIds,
  scrollContainerRef,
}: UseMenuSectionNavParams) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lockRef = useRef(false);
  const lockTimerRef = useRef<number | null>(null);
  const [activeSectionId, setActiveSectionId] = useState(sectionIds[0] ?? "");
  const activeSectionIdRef = useRef(activeSectionId);
  activeSectionIdRef.current = activeSectionId;

  const resolveContainer = useCallback(
    () =>
      resolveMenuScrollContainer(
        rootRef.current,
        scrollContainerRef?.current ?? null
      ),
    [scrollContainerRef]
  );

  useEffect(() => {
    if (!enabled) return;
    if (sectionIds.length === 0) {
      setActiveSectionId("");
      return;
    }
    if (!sectionIds.includes(activeSectionId)) {
      setActiveSectionId(sectionIds[0]);
    }
  }, [activeSectionId, enabled, sectionIds]);

  const syncFromScroll = useCallback(() => {
    if (!enabled || lockRef.current || sectionIds.length === 0) return;

    const container = resolveContainer();
    const scale =
      container instanceof HTMLElement ? readElementScale(container) : 1;
    const offset = measureStickyNavOffset(container, scale);
    const viewportTop =
      container instanceof HTMLElement
        ? container.getBoundingClientRect().top
        : 0;
    const marker = measureScrollMarker(container, offset);

    const measured = sectionIds.flatMap((id) => {
      const element = document.getElementById(menuSectionAnchorId(id));
      return element
        ? [{ id, top: element.getBoundingClientRect().top }]
        : [];
    });

    const next = pickActiveMenuSection(measured, marker, viewportTop);
    if (next && next !== activeSectionIdRef.current) {
      setActiveSectionId(next);
    }
  }, [enabled, resolveContainer, sectionIds]);

  useEffect(() => {
    if (!enabled) return;

    const container = resolveContainer();
    const target: HTMLElement | Window =
      container instanceof HTMLElement ? container : window;

    target.addEventListener("scroll", syncFromScroll, { passive: true });
    window.addEventListener("resize", syncFromScroll);
    syncFromScroll();

    return () => {
      target.removeEventListener("scroll", syncFromScroll);
      window.removeEventListener("resize", syncFromScroll);
    };
  }, [enabled, resolveContainer, sectionIds, syncFromScroll]);

  const scrollToSection = useCallback(
    (categoryId: string) => {
      if (!enabled) return;

      const section = document.getElementById(menuSectionAnchorId(categoryId));
      if (!section) return;

      const container = resolveContainer();
      const scale =
        container instanceof HTMLElement ? readElementScale(container) : 1;
      const offset = measureStickyNavOffset(container, scale);
      const top = Math.max(
        0,
        computeSectionScrollTop(section, container, offset)
      );

      lockRef.current = true;
      setActiveSectionId(categoryId);

      if (container instanceof HTMLElement) {
        container.scrollTo({ top, behavior: "smooth" });
      } else {
        window.scrollTo({ top, behavior: "smooth" });
      }

      if (lockTimerRef.current != null) {
        window.clearTimeout(lockTimerRef.current);
      }
      lockTimerRef.current = window.setTimeout(() => {
        lockRef.current = false;
        syncFromScroll();
      }, 480);
    },
    [enabled, resolveContainer, syncFromScroll]
  );

  useEffect(
    () => () => {
      if (lockTimerRef.current != null) {
        window.clearTimeout(lockTimerRef.current);
      }
    },
    []
  );

  return {
    rootRef,
    activeSectionId,
    scrollToSection,
  };
}
