import { Pressable, Text, View, type ViewProps } from "react-native";

export function Screen({ children, className = "", ...props }: ViewProps) {
  return (
    <View className={`flex-1 bg-cosmo-surface px-4 pt-4 ${className}`} {...props}>
      {children}
    </View>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`rounded-2xl bg-cosmo-card p-4 border border-slate-700/40 ${className}`}>
      {children}
    </View>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-3">
      <Text className="text-white text-xl font-semibold">{title}</Text>
      {subtitle ? <Text className="text-cosmo-muted mt-1">{subtitle}</Text> : null}
    </View>
  );
}

export function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-green-400"
      : tone === "warning"
        ? "text-amber-400"
        : tone === "danger"
          ? "text-red-400"
          : "text-white";

  return (
    <Card className="flex-1 min-w-[46%]">
      <Text className="text-cosmo-muted text-sm">{label}</Text>
      <Text className={`text-2xl font-bold mt-2 ${toneClass}`}>{value}</Text>
    </Card>
  );
}

export function Badge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const classes =
    tone === "success"
      ? "bg-green-500/20 text-green-300"
      : tone === "warning"
        ? "bg-amber-500/20 text-amber-300"
        : tone === "danger"
          ? "bg-red-500/20 text-red-300"
          : "bg-indigo-500/20 text-indigo-200";

  return (
    <View className={`self-start rounded-full px-3 py-1 ${classes}`}>
      <Text className="text-xs font-medium">{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      className={`rounded-xl px-4 py-3 ${disabled || loading ? "bg-indigo-900" : "bg-cosmo-primary"}`}
      disabled={disabled || loading}
      onPress={onPress}
    >
      <Text className="text-center text-white font-semibold">
        {loading ? "Aguarde..." : label}
      </Text>
    </Pressable>
  );
}

export function CommandButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      className={`rounded-xl border border-slate-600 px-4 py-4 ${disabled ? "opacity-50" : ""}`}
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="text-white text-center font-medium">{label}</Text>
    </Pressable>
  );
}
