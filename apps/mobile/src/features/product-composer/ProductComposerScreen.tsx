import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/features/products/types/product";
import { isOptionAvailable } from "@/features/product-engine/utils/availabilityFilter";
import { useMobileProductComposer } from "./useMobileProductComposer";

export default function ProductComposerScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const composer = useMobileProductComposer(product);

  useEffect(() => {
    if (!productId) return;

    supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setProduct(data as Product);
        }
      });
  }, [productId]);

  if (!product || composer.loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  const unitPrice = composer.pricing?.total ?? Number(product.price);
  const lineTotal = unitPrice * composer.quantity;

  return (
    <ScrollView className="flex-1 bg-slate-950 px-4 py-6">
      <Text className="text-2xl font-bold text-white">{product.name}</Text>
      <Text className="mt-1 text-sm text-slate-400">
        Product Engine — mesma experiência do PDV
      </Text>

      {composer.blocked ? (
        <View className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <Text className="text-red-300">
            {composer.blockedReason ?? "Produto indisponível."}
          </Text>
        </View>
      ) : (
        composer.node?.groups.map((group) => (
          <View
            key={group.id}
            className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <Text className="text-lg font-semibold text-white">{group.name}</Text>
            <Text className="mt-1 text-xs text-slate-400">
              Mín. {group.minSelection} · Máx. {group.maxSelection}
            </Text>

            {(composer.node?.optionsByGroupId[group.id] ?? []).map((option) => {
              const selected = (composer.selections[group.id] ?? []).some(
                (entry) => entry.optionId === option.id
              );
              const disabled = !isOptionAvailable(option);

              return (
                <Pressable
                  key={option.id}
                  disabled={disabled}
                  onPress={() => composer.toggleOption(group.id, option.id)}
                  className={`mt-3 rounded-xl border px-4 py-3 ${
                    selected
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700"
                  } ${disabled ? "opacity-40" : ""}`}
                >
                  <Text className="font-medium text-white">{option.name}</Text>
                  <Text className="text-sm text-blue-300">
                    {option.price > 0 ? `+ R$ ${option.price.toFixed(2)}` : "Incluso"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))
      )}

      <View className="mt-6 gap-3">
        <Text className="text-sm text-slate-300">Quantidade</Text>
        <TextInput
          keyboardType="number-pad"
          value={String(composer.quantity)}
          onChangeText={(value) => composer.setQuantity(Number(value) || 1)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
        />

        <Text className="text-sm text-slate-300">Observação</Text>
        <TextInput
          value={composer.observation}
          onChangeText={composer.setObservation}
          placeholder="Ex.: sem cebola"
          placeholderTextColor="#64748b"
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
        />
      </View>

      {composer.validation && !composer.validation.valid && (
        <Text className="mt-4 text-sm text-amber-400">
          {composer.validation.errors[0]}
        </Text>
      )}

      <View className="mt-6 rounded-2xl bg-slate-900 p-4">
        <Text className="text-slate-400">Total</Text>
        <Text className="text-2xl font-bold text-blue-400">
          R$ {lineTotal.toFixed(2)}
        </Text>
      </View>

      <Pressable
        disabled={composer.blocked || !composer.validation?.valid}
        onPress={() => {
          const result = composer.confirm();
          if (!result.valid) return;
          router.back();
        }}
        className="mt-6 mb-10 rounded-xl bg-blue-600 py-4"
      >
        <Text className="text-center font-semibold text-white">
          Confirmar composição
        </Text>
      </Pressable>
    </ScrollView>
  );
}
