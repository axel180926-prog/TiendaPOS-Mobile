import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Animated } from 'react-native';
import { Audio } from 'expo-av';
import { useScannerConfigStore } from '../store/useScannerConfigStore';

export const useScannerFeedback = () => {
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [flashOpacity] = useState(new Animated.Value(0));
  const config = useScannerConfigStore();
  const soundRef = useRef<Audio.Sound | null>(null);

  // Configurar audio al montar
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    return () => {
      // Cleanup: liberar sonido al desmontar
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playBeepSound = async () => {
    try {
      // Si ya existe un sonido, reutilizarlo
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      } else {
        // Crear sonido beep sintético usando Audio
        // Nota: En producción, podrías usar un archivo .mp3 de beep
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=scanner-beep-95077.mp3' },
          { shouldPlay: true, volume: 0.5 }
        );
        soundRef.current = sound;
      }
    } catch (error) {
      console.warn('Error al reproducir sonido:', error);
    }
  };

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

    // Sonido beep
    if (config.sonidoHabilitado) {
      playBeepSound();
    }
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
