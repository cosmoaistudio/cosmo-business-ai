import { describe, expect, it, vi, beforeEach } from "vitest";
import { remoteCommandsService } from "@/features/remote-commands/remoteCommands.service";
import { REMOTE_COMMANDS } from "@cosmo/remote-commands";

vi.mock("@/config/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "@/config/supabase";

describe("Remote Commands — integração web → desktop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatchPrintOrder insere comando remoto", async () => {
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "cmd-print-1", status: "pending" },
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(insertChain as never);

    const result = await remoteCommandsService.dispatchPrintOrder({
      organizationId: "org-1",
      saleId: "sale-1",
      saleNumber: 10,
      lines: ["Venda #10", "Total: R$ 50,00"],
    });

    expect(supabase.from).toHaveBeenCalledWith("remote_commands");
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        command: REMOTE_COMMANDS.PRINT_ORDER,
        status: "pending",
        source: "pdv",
      })
    );
    expect(result.id).toBe("cmd-print-1");
  });

  it("propaga erro de insert", async () => {
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "RLS violation" },
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(insertChain as never);

    await expect(
      remoteCommandsService.dispatchPrintOrder({
        organizationId: "org-1",
        saleId: "sale-1",
        saleNumber: 1,
        lines: [],
      })
    ).rejects.toEqual({ message: "RLS violation" });
  });
});
