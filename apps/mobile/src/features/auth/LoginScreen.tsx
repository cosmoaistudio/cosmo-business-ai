import { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { PrimaryButton, Screen, SectionTitle } from "@/components/ui";
import { useAuth } from "@/hooks";

export function LoginScreen() {
  const { signIn, isSigningIn, signInError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignIn() {
    try {
      await signIn({ email: email.trim(), password });
      router.replace("/(app)");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha no login";
      Alert.alert("Login", message);
    }
  }

  return (
    <Screen className="justify-center">
      <SectionTitle
        title="Cosmo Mobile"
        subtitle="Centro de comando da operação"
      />

      <View className="mt-6 gap-4">
        <View>
          <Text className="text-cosmo-muted mb-2">E-mail</Text>
          <TextInput
            className="rounded-xl border border-slate-600 px-3 py-3 text-white"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor="#64748b"
          />
        </View>

        <View>
          <Text className="text-cosmo-muted mb-2">Senha</Text>
          <TextInput
            className="rounded-xl border border-slate-600 px-3 py-3 text-white"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
          />
        </View>

        {signInError ? (
          <Text className="text-red-400">{signInError.message}</Text>
        ) : null}

        <PrimaryButton
          label="Entrar"
          onPress={() => void handleSignIn()}
          loading={isSigningIn}
          disabled={!email || !password}
        />
      </View>
    </Screen>
  );
}
