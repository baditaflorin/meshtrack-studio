import { useEffect, useRef, useState } from "react";

type MotionPermissionState = "granted" | "denied";

type PermissionEventConstructor = {
  requestPermission?: () => Promise<MotionPermissionState>;
};

export type AccelerometerData = {
  // Orientation (Tilt)
  alpha: number | null; // Z
  beta: number | null; // X (Front-to-back tilt)
  gamma: number | null; // Y (Left-to-right tilt)
  // Motion (Acceleration)
  accelX: number | null;
  accelY: number | null;
  accelZ: number | null;
  shake: number; // Calculated shake intensity
};

export function useAccelerometer() {
  const initialPermissionState =
    typeof window === "undefined" ? null : detectDefaultPermissionState();
  const [data, setData] = useState<AccelerometerData>({
    alpha: null,
    beta: null,
    gamma: null,
    accelX: null,
    accelY: null,
    accelZ: null,
    shake: 0,
  });

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    initialPermissionState,
  );

  const orientationHandlerRef = useRef<
    ((e: DeviceOrientationEvent) => void) | null
  >(null);
  const motionHandlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(
    null,
  );

  useEffect(() => {
    // 1. Orientation Handler
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setData((prev) => ({
        ...prev,
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      }));
    };
    orientationHandlerRef.current = handleOrientation;

    // 2. Motion Handler
    const handleMotion = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity;
      if (!accel) return;

      const x = accel.x ?? 0;
      const y = accel.y ?? 0;
      const z = accel.z ?? 0;

      // Basic shake detection (delta from gravity)
      const force = Math.sqrt(x * x + y * y + z * z);
      const shakeIntensity = Math.max(0, force - 9.8); // 9.8 is standard gravity

      setData((prev) => ({
        ...prev,
        accelX: x,
        accelY: y,
        accelZ: z,
        shake: shakeIntensity,
      }));
    };
    motionHandlerRef.current = handleMotion;

    const orientationApi = getOrientationPermissionApi();
    const isIOS = Boolean(orientationApi?.requestPermission);

    if (!isIOS) {
      if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handleOrientation);
      }
      if (window.DeviceMotionEvent) {
        window.addEventListener("devicemotion", handleMotion);
      }
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, []);

  const triggerPermission = async () => {
    const orientationApi = getOrientationPermissionApi();
    const motionApi = getMotionPermissionApi();

    if (orientationApi?.requestPermission) {
      try {
        const orientationRes = await orientationApi.requestPermission();
        const motionRes = motionApi?.requestPermission
          ? await motionApi.requestPermission()
          : orientationRes;

        const granted = orientationRes === "granted" && motionRes === "granted";
        setPermissionGranted(granted);

        if (granted) {
          if (orientationHandlerRef.current) {
            window.addEventListener(
              "deviceorientation",
              orientationHandlerRef.current,
            );
          }
          if (motionHandlerRef.current) {
            window.addEventListener("devicemotion", motionHandlerRef.current);
          }
        }
      } catch (err) {
        console.error("Accelerometer permission error:", err);
        setPermissionGranted(false);
      }
    } else {
      // Not iOS or older iOS, permissions should be auto-granted or not supported
      setPermissionGranted(detectDefaultPermissionState() ?? true);
    }
  };

  return { data, permissionGranted, triggerPermission };
}

function getOrientationPermissionApi(): PermissionEventConstructor | null {
  if (typeof DeviceOrientationEvent === "undefined") {
    return null;
  }

  return DeviceOrientationEvent as PermissionEventConstructor;
}

function getMotionPermissionApi(): PermissionEventConstructor | null {
  if (typeof DeviceMotionEvent === "undefined") {
    return null;
  }

  return DeviceMotionEvent as PermissionEventConstructor;
}

function detectDefaultPermissionState(): boolean | null {
  const orientationApi = getOrientationPermissionApi();
  const motionApi = getMotionPermissionApi();
  const requiresPrompt =
    Boolean(orientationApi?.requestPermission) ||
    Boolean(motionApi?.requestPermission);

  if (requiresPrompt) {
    return null;
  }

  if (
    typeof window !== "undefined" &&
    (window.DeviceOrientationEvent || window.DeviceMotionEvent)
  ) {
    return true;
  }

  return false;
}
