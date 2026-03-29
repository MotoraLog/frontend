import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';

type ToastKind = 'success' | 'info' | 'error';

type ToastState = {
  visible: boolean;
  message: string;
  kind: ToastKind;
};

type ToastContextValue = {
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
  showError: (message: string) => void;
};

const TOAST_DURATION_MS = 2200;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    kind: 'success',
  });
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -10,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    });
  }, [opacity, translateY]);

  const animateIn = useCallback(() => {
    opacity.setValue(0);
    translateY.setValue(-10);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const showToast = useCallback((message: string, kind: ToastKind) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    setToast({ visible: true, message, kind });
    animateIn();

    hideTimeoutRef.current = setTimeout(() => {
      hideToast();
      hideTimeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }, [animateIn, hideToast]);

  const value = useMemo<ToastContextValue>(
    () => ({
      showSuccess: (message: string) => showToast(message, 'success'),
      showInfo: (message: string) => showToast(message, 'info'),
      showError: (message: string) => showToast(message, 'error'),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast.visible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.overlay,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.toast,
              toast.kind === 'success'
                ? styles.success
                : toast.kind === 'error'
                  ? styles.error
                  : styles.info,
            ]}
          >
            <Text style={styles.toastText}>{toast.message}</Text>
          </Animated.View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider.');
  }

  return context;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 18,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  toast: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '100%',
  },
  success: {
    backgroundColor: '#1f8a57',
  },
  info: {
    backgroundColor: '#2f6fed',
  },
  error: {
    backgroundColor: '#c03232',
  },
  toastText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
});
