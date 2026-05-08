import { useEffect, useRef, useState } from "react";

export type AccelerometerData = {
  // Orientation (Tilt)
  alpha: number | null; // Z
  beta: number | null;  // X (Front-to-back tilt)
  gamma: number | null; // Y (Left-to-right tilt)
  // Motion (Acceleration)
  accelX: number | null;
  accelY: number | null;
  accelZ: number | null;
  shake: number; // Calculated shake intensity
};

export function useAccelerometer() {
  const [data, setData] = useState<AccelerometerData>({
    alpha: null,
    beta: null,
    gamma: null,
    accelX: null,
    accelY: null,
    accelZ: null,
    shake: 0,
  });
  
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  
  const orientationHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const motionHandlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  useEffect(() => {
    // 1. Orientation Handler
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setData(prev => ({
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
      const force = Math.sqrt(x*x + y*y + z*z);
      const shakeIntensity = Math.max(0, force - 9.8); // 9.8 is standard gravity

      setData(prev => ({
        ...prev,
        accelX: x,
        accelY: y,
        accelZ: z,
        shake: shakeIntensity,
      }));
    };
    motionHandlerRef.current = handleMotion;

    // Auto-attach for non-permission-based platforms (Android / Chrome Desktop / Firefox)
    // @ts-ignore
    const isIOS = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
    
    if (!isIOS) {
      if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handleOrientation);
        setPermissionGranted(true);
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
    // Explicitly for iOS 13+ 
    // @ts-ignore
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        // @ts-ignore
        const orientationRes = await DeviceOrientationEvent.requestPermission();
        // @ts-ignore
        const motionRes = typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function' 
          // @ts-ignore
          ? await DeviceMotionEvent.requestPermission() 
          : orientationRes;

        const granted = orientationRes === "granted" && motionRes === "granted";
        setPermissionGranted(granted);

        if (granted) {
          if (orientationHandlerRef.current) {
            window.addEventListener("deviceorientation", orientationHandlerRef.current);
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
      setPermissionGranted(true);
    }
  };

  return { data, permissionGranted, triggerPermission };
}
