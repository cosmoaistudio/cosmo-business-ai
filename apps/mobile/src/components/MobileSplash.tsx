import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface MobileSplashProps {
  onFinish?: () => void;
  durationMs?: number;
}

export function MobileSplash({ onFinish, durationMs = 2200 }: MobileSplashProps) {
  const [visible, setVisible] = useState(true);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 24000, easing: Easing.linear }),
      -1
    );
  }, [rotation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onFinish]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-[#050816]">
      <Animated.View
        style={logoStyle}
        className="h-24 w-24 items-center justify-center rounded-[28px] bg-blue-600 shadow-lg"
      >
        <Text className="text-5xl font-black text-white">C</Text>
      </Animated.View>
      <Text className="mt-10 text-4xl font-black tracking-[0.28em] text-white">
        COSMO
      </Text>
      <Text className="mt-2 text-base text-blue-300">Business AI</Text>
      <Text className="mt-8 text-sm text-slate-500">
        O futuro da gestão começa aqui.
      </Text>
    </View>
  );
}
