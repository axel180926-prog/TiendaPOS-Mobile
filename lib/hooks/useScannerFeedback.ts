import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Animated } from 'react-native';
import { useScannerConfigStore } from '../store/useScannerConfigStore';

export const useScannerFeedback = () => {
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [flashOpacity] = useState(new Animated.Value(0));
  const config = useScannerConfigStore();

  const triggerScanSuccess = () => {
    // Vibración
    if (config.vibracionHabilitada) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Flash visual
    if (config.flashVisualHabilitado) {
      setShowSuccessFlash(true);
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.7,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowSuccessFlash(false));
    }

    // TODO: Sonido (requiere expo-av)
    // if (config.sonidoHabilitado) {
    //   playBeepSound();
    // }
  };

  const triggerScanError = () => {
    if (config.vibracionHabilitada) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return {
    triggerScanSuccess,
    triggerScanError,
    showSuccessFlash,
    flashOpacity,
  };
};
