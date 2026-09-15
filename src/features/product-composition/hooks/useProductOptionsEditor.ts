import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { productCompositionService } from "../services/productComposition.service";
import type { OptionGroup } from "../types/optionGroup";
import type { ProductOptionGroupWithGroup } from "../types/productOptionGroup";
import {
  canLinkOptionGroup,
  filterUnlinkedOptionGroups,
  getLinkedGroupIds,
  isPendingLinkId,
  makePendingProductOptionLink,
} from "../utils/productOptionLinkRules";

export type LinkedGroupView = ProductOptionGroupWithGroup & {
  optionCount: number;
};

export function useProductOptionsEditor(productId?: string) {
  const [linkedGroups, setLinkedGroups] = useState<LinkedGroupView[]>([]);
  const [allGroups, setAllGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadOptionCounts = useCallback(async (groupIds: string[]) => {
    const unique = [...new Set(groupIds.filter(Boolean))];
    const entries = await Promise.all(
      unique.map(async (groupId) => {
        try {
          const options =
            await productCompositionService.getOptionsByGroupId(groupId);
          return [groupId, options.length] as const;
        } catch {
          return [groupId, 0] as const;
        }
      })
    );
    return new Map(entries);
  }, []);

  const reload = useCallback(async () => {
    try {
      setLoading(true);

      if (!productId) {
        const groups = await productCompositionService.getOptionGroups();
        setAllGroups(groups);
        setLinkedGroups((current) =>
          current.filter((link) => isPendingLinkId(link.id))
        );
        return;
      }

      const [linked, groups] = await Promise.all([
        productCompositionService.getProductOptionGroups(productId),
        productCompositionService.getOptionGroups(),
      ]);

      const counts = await loadOptionCounts(linked.map((link) => link.group_id));

      setAllGroups(groups);
      setLinkedGroups(
        linked.map((link) => ({
          ...link,
          optionCount: counts.get(link.group_id) ?? 0,
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar opções do produto:", error);
      toast.error(getErrorMessage(error, "Erro ao carregar opções do produto."));
    } finally {
      setLoading(false);
    }
  }, [productId, loadOptionCounts]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const availableGroups = useMemo(
    () =>
      filterUnlinkedOptionGroups(allGroups, getLinkedGroupIds(linkedGroups)),
    [allGroups, linkedGroups]
  );

  async function persistSortOrder(groups: ProductOptionGroupWithGroup[]) {
    if (!productId) return;

    await Promise.all(
      groups.map((link, index) =>
        productCompositionService.updateProductOptionGroupLink(link.id, {
          sort_order: index,
        })
      )
    );
  }

  function rememberGroup(group: OptionGroup) {
    setAllGroups((current) => {
      const exists = current.some((item) => item.id === group.id);
      return exists
        ? current.map((item) => (item.id === group.id ? group : item))
        : [...current, group];
    });
  }

  async function addGroup(groupId: string, knownGroup?: OptionGroup) {
    const check = canLinkOptionGroup(groupId, getLinkedGroupIds(linkedGroups));
    if (!check.ok) {
      if (check.reason === "duplicate") {
        toast.warning("Este adicional já está vinculado ao produto.");
      }
      return false;
    }

    let resolved =
      knownGroup ??
      allGroups.find((item) => item.id === groupId) ??
      null;

    if (!resolved) {
      try {
        resolved = await productCompositionService.getOptionGroupById(groupId);
      } catch {
        resolved = null;
      }
    }

    if (!resolved) {
      toast.error("Grupo não encontrado.");
      return false;
    }

    rememberGroup(resolved);

    try {
      setSaving(true);
      const counts = await loadOptionCounts([groupId]);
      const optionCount = counts.get(groupId) ?? 0;

      if (!productId) {
        setLinkedGroups((current) => [
          ...current,
          makePendingProductOptionLink(
            resolved!,
            current.length,
            optionCount
          ) as LinkedGroupView,
        ]);
        toast.success(
          "Adicional reservado. Será vinculado ao salvar o produto."
        );
        return true;
      }

      const created = await productCompositionService.linkProductOptionGroup({
        product_id: productId,
        group_id: groupId,
        sort_order: linkedGroups.length,
      });

      setLinkedGroups((current) => [
        ...current,
        {
          ...created,
          optionCount,
        },
      ]);
      toast.success("Adicional vinculado.");
      return true;
    } catch (error) {
      console.error("Erro ao adicionar grupo:", error);
      toast.error(getErrorMessage(error, "Não foi possível adicionar o grupo."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function removeGroup(linkId: string) {
    const previous = linkedGroups;

    try {
      setSaving(true);

      if (isPendingLinkId(linkId) || !productId) {
        setLinkedGroups((current) =>
          current
            .filter((link) => link.id !== linkId)
            .map((link, index) => ({ ...link, sort_order: index }))
        );
        toast.success("Vínculo removido.");
        return;
      }

      const next = previous.filter((link) => link.id !== linkId);
      setLinkedGroups(next);

      await productCompositionService.unlinkProductOptionGroup(linkId);
      await persistSortOrder(next);

      setLinkedGroups(
        next.map((link, index) => ({ ...link, sort_order: index }))
      );

      toast.success("Vínculo removido do produto.");
    } catch (error) {
      console.error("Erro ao remover grupo:", error);
      setLinkedGroups(previous);
      toast.error(getErrorMessage(error, "Não foi possível remover o grupo."));
    } finally {
      setSaving(false);
    }
  }

  async function moveGroup(linkId: string, direction: "up" | "down") {
    const index = linkedGroups.findIndex((link) => link.id === linkId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= linkedGroups.length) return;

    const previous = linkedGroups;
    const next = [...linkedGroups];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);

    const reordered = next.map((link, sortIndex) => ({
      ...link,
      sort_order: sortIndex,
    }));

    try {
      setSaving(true);
      setLinkedGroups(reordered);
      if (productId && !reordered.some((link) => isPendingLinkId(link.id))) {
        await persistSortOrder(reordered);
      }
    } catch (error) {
      console.error("Erro ao reordenar grupos:", error);
      setLinkedGroups(previous);
      toast.error(getErrorMessage(error, "Não foi possível reordenar os grupos."));
    } finally {
      setSaving(false);
    }
  }

  async function attachCreatedGroup(group: OptionGroup) {
    rememberGroup(group);
    const alreadyLinked = linkedGroups.some(
      (link) => link.group_id === group.id
    );
    if (alreadyLinked) {
      await refreshGroupMeta(group);
      return;
    }
    await addGroup(group.id, group);
  }

  async function refreshGroupMeta(group: OptionGroup) {
    rememberGroup(group);
    const counts = await loadOptionCounts([group.id]);
    const optionCount = counts.get(group.id) ?? 0;

    setLinkedGroups((current) =>
      current.map((link) =>
        link.group_id === group.id
          ? { ...link, option_groups: group, optionCount }
          : link
      )
    );
  }

  async function flushPendingLinks(targetProductId: string) {
    const pending = linkedGroups.filter((link) => isPendingLinkId(link.id));
    if (pending.length === 0) return;

    try {
      setSaving(true);
      for (let index = 0; index < pending.length; index += 1) {
        const link = pending[index];
        await productCompositionService.linkProductOptionGroup({
          product_id: targetProductId,
          group_id: link.group_id,
          sort_order: index,
        });
      }
      // Clear pending and load real links for the new product id (caller remounts with id).
      setLinkedGroups([]);
    } catch (error) {
      console.error("Erro ao vincular adicionais pendentes:", error);
      toast.error(
        getErrorMessage(
          error,
          "Produto salvo, mas falhou ao vincular adicionais."
        )
      );
      throw error;
    } finally {
      setSaving(false);
    }
  }

  return {
    linkedGroups,
    availableGroups,
    allGroups,
    loading,
    saving,
    reload,
    addGroup,
    removeGroup,
    moveGroup,
    attachCreatedGroup,
    refreshGroupMeta,
    flushPendingLinks,
    hasPendingLinks: linkedGroups.some((link) => isPendingLinkId(link.id)),
  };
}
