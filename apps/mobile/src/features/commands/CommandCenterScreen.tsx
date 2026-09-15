import { Alert, ScrollView, View } from "react-native";
import { REMOTE_COMMANDS } from "@cosmo/remote-commands";
import { CommandButton, Screen, SectionTitle } from "@/components/ui";
import { useOrganizationId, useRemoteCommand } from "@/hooks";

export function CommandCenterScreen() {
  const organizationId = useOrganizationId();
  const commandMutation = useRemoteCommand();

  async function runCommand(
    label: string,
    command: (typeof REMOTE_COMMANDS)[keyof typeof REMOTE_COMMANDS],
    payload: Record<string, unknown> = {}
  ) {
    try {
      await commandMutation.mutateAsync({ command, payload });
      Alert.alert("Comando enviado", `${label} foi despachado para o Desktop.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao enviar comando";
      Alert.alert("Erro", message);
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionTitle
          title="Command Center"
          subtitle="Controle remoto do Cosmo Desktop"
        />

        <View className="gap-3 mt-2">
          <CommandButton
            label="Imprimir pedido"
            disabled={!organizationId || commandMutation.isPending}
            onPress={() =>
              void runCommand("Imprimir pedido", REMOTE_COMMANDS.PRINT_ORDER, {
                title: "PEDIDO MOBILE",
                lines: ["Pedido enviado pelo Cosmo Mobile"],
              })
            }
          />
          <CommandButton
            label="Abrir gaveta"
            disabled={!organizationId || commandMutation.isPending}
            onPress={() => void runCommand("Abrir gaveta", REMOTE_COMMANDS.OPEN_DRAWER)}
          />
          <CommandButton
            label="Fechar caixa"
            disabled={!organizationId || commandMutation.isPending}
            onPress={() =>
              void runCommand("Fechar caixa", REMOTE_COMMANDS.CLOSE_CASH_REGISTER, {
                closingBalance: 0,
              })
            }
          />
          <CommandButton
            label="Pausar produto"
            disabled={!organizationId || commandMutation.isPending}
            onPress={() =>
              void runCommand("Pausar produto", REMOTE_COMMANDS.PAUSE_PRODUCT, {
                productId: "configure-no-mobile",
              })
            }
          />
          <CommandButton
            label="Ativar produto"
            disabled={!organizationId || commandMutation.isPending}
            onPress={() =>
              void runCommand("Ativar produto", REMOTE_COMMANDS.ACTIVATE_PRODUCT, {
                productId: "configure-no-mobile",
              })
            }
          />
          <CommandButton
            label="Atualizar estoque"
            disabled={!organizationId || commandMutation.isPending}
            onPress={() =>
              void runCommand("Atualizar estoque", REMOTE_COMMANDS.UPDATE_STOCK, {
                productId: "configure-no-mobile",
                quantity: 1,
                movementType: "adjustment",
                reason: "mobile-command-center",
              })
            }
          />
          <CommandButton
            label="Executar backup"
            disabled={!organizationId || commandMutation.isPending}
            onPress={() => void runCommand("Executar backup", REMOTE_COMMANDS.RUN_BACKUP)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
