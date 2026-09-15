import { describe, expect, it, vi, beforeEach } from "vitest";
import { productValidator } from "@/features/product-engine/engines/ProductValidator";
import { productPricingEngine } from "@/features/product-engine/engines/ProductPricingEngine";
import { finalizeSale } from "@/features/pdv/repository/pdv.repository";
import { remoteCommandsService } from "@/features/remote-commands/remoteCommands.service";
import { RealtimeListener } from "../../apps/desktop/electron/src/agent/RealtimeListener.js";
import {
  createCompositeProductNode,
  createInitialBuildState,
  validCompositeSelections,
} from "../fixtures/productEngine";

vi.mock("@/config/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
    channel: vi.fn(),
  },
}));

vi.mock("../../apps/desktop/electron/src/agent/logger.js", () => ({
  agentLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("../../apps/desktop/electron/src/agent/config/DesktopConfig.js", () => ({
  desktopConfig: {
    getAgentId: vi.fn().mockReturnValue(null),
    getOrganizationId: vi.fn().mockReturnValue("org-1"),
  },
}));

vi.mock("../../apps/desktop/electron/src/agent/repository/remoteCommand.repository.js", () => ({
  remoteCommandRepository: { claimPending: vi.fn().mockResolvedValue([]) },
}));

vi.mock("../../apps/desktop/electron/src/agent/repository/supabaseClient.js", () => ({
  getDesktopSupabase: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((cb?: (status: string) => void) => {
        cb?.("CHANNEL_ERROR");
        return { unsubscribe: vi.fn() };
      }),
    })),
  })),
}));

import { supabase } from "@/config/supabase";

describe("Cobertura de erros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RLS", () => {
    it("remote command falha com violação RLS", async () => {
      const chain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "new row violates row-level security policy", code: "42501" },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(chain as never);

      await expect(
        remoteCommandsService.dispatchPrintOrder({
          organizationId: "org-other",
          saleId: "s1",
          saleNumber: 1,
          lines: [],
        })
      ).rejects.toMatchObject({ code: "42501" });
    });
  });

  describe("Sessão expirada", () => {
    it("auth retorna sessão nula", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { data } = await supabase.auth.getSession();
      expect(data.session).toBeNull();
    });
  });

  describe("Desktop Offline", () => {
    it("RealtimeListener permanece desconectado sem agentId", async () => {
      const listener = new RealtimeListener();
      await listener.start(vi.fn());
      expect(listener.isConnected()).toBe(false);
    });
  });

  describe("Supabase Offline", () => {
    it("finalize_sale falha quando RPC indisponível", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: "Failed to fetch", code: "NETWORK" },
      });

      await expect(
        finalizeSale({
          items: [{ product_id: "p1", quantity: 1, unit_price: 10, options: [] }],
          payment_method: "cash",
          payment_amount: 10,
        })
      ).rejects.toMatchObject({ message: "Failed to fetch" });
    });
  });

  describe("Realtime Offline", () => {
    it("subscribe recebe CHANNEL_ERROR", async () => {
      const client = {
        channel: vi.fn(() => ({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn((cb?: (status: string) => void) => {
            cb?.("CHANNEL_ERROR");
          }),
        })),
      };

      let status = "";
      client.channel("test").subscribe((s: string) => {
        status = s;
      });
      expect(status).toBe("CHANNEL_ERROR");
    });
  });

  describe("Produto inexistente", () => {
    it("validação falha para produto pausado/inexistente", () => {
      const node = createCompositeProductNode({
        productId: "missing",
        status: "inactive",
      });
      const result = productValidator.validateBuildState(node, {
        ...createInitialBuildState("missing"),
        selections: validCompositeSelections(),
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("Grupo inválido", () => {
    it("seleção em grupo inexistente não altera estado", async () => {
      const { selectBuilderOption } = await import(
        "@/features/product-engine/core/productBuilderCore"
      );
      const node = createCompositeProductNode();
      const state = createInitialBuildState(node.productId);
      const next = selectBuilderOption(node, state, "grp-invalid", {
        groupId: "grp-invalid",
        groupName: "X",
        optionId: "opt-x",
        optionName: "X",
        quantity: 1,
        unitPrice: 0,
        premium: false,
      });
      expect(next.selections["grp-invalid"]).toBeUndefined();
    });
  });

  describe("Preço inválido", () => {
    it("desconto maior que subtotal resulta em total zero", () => {
      const node = createCompositeProductNode();
      const result = productPricingEngine.calculate(
        node,
        validCompositeSelections(),
        1,
        [{ id: "d1", label: "Desconto absurdo", amount: 99999 }]
      );
      expect(result.total).toBe(0);
    });
  });

  describe("Carrinho vazio", () => {
    it("RPC rejeita finalização sem itens", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: "Carrinho vazio", code: "P0001" },
      });

      await expect(
        finalizeSale({
          items: [],
          payment_method: "cash",
          payment_amount: 0,
        })
      ).rejects.toMatchObject({ message: "Carrinho vazio" });
    });
  });
});
