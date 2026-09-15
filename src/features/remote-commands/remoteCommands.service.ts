import { supabase } from "@/config/supabase";
import { REMOTE_COMMANDS } from "@cosmo/remote-commands";

export interface DispatchPrintOrderInput {
  organizationId: string;
  saleId: string;
  saleNumber: number;
  lines: string[];
  title?: string;
}

export const remoteCommandsService = {
  async dispatchPrintOrder(input: DispatchPrintOrderInput) {
    const { data, error } = await supabase
      .from("remote_commands")
      .insert({
        organization_id: input.organizationId,
        command: REMOTE_COMMANDS.PRINT_ORDER,
        payload: {
          saleId: input.saleId,
          saleNumber: input.saleNumber,
          lines: input.lines,
          title: input.title ?? `Venda #${input.saleNumber}`,
        },
        source: "pdv",
        status: "pending",
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },
};
