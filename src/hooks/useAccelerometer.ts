import { useEffect, useRef, useState } from "react";

export type AccelerometerData = {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
};

export function useAccelerometer() {
  const [data, setData] = useState<AccelerometerData>({
    alpha: null,
    beta: null,
    gamma: null,
  });
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  // stable ref to the handler so we can remove it cleanly
  const handlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  useEffect(() => {
    const handler = (event: DeviceOrientationEvent) => {
      setData({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      });
    };
    handlerRef.current = handler;

    // Non-iOS: just listen directly (no permission API)
    // @ts-ignore
    if (typeof DeviceOrientationEvent.requestPermission !== "function") {
      if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handler);
        setPermissionGranted(true);
      } else {
        setPermissionGranted(false);
      }
    }
    // iOS: permission must be requested by a user gesture — handled in triggerPermission()

    return () => {
      window.removeEventListener("deviceorientation", handler);
    };
  }, []);

  const triggerPermission = async () => {
    // @ts-ignore
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      try {
        // @ts-ignore
        const response = await DeviceOrientationEvent.requestPermission();
        const granted = response === "granted";
        setPermissionGranted(granted);
        if (granted && handlerRef.current) {
          // Only add if not already added
          window.removeEventListener("deviceorientation", handlerRef.current);
          window.addEventListener("deviceorientation", handlerRef.current);
        }
      } catch {
        setPermissionGranted(false);
      }
    }
  };

  return { data, permissionGranted, triggerPermission };
}
