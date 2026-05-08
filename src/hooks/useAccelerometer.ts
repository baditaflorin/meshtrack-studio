import { useEffect, useState } from "react";

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

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setData({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      });
    };


    // We don't automatically request on mount because it usually requires a user gesture
    // But we can check if it's already available
    if (window.DeviceOrientationEvent) {
       // Just listen if it doesn't need explicit permission (Android/Desktop)
       // @ts-ignore
       if (typeof DeviceOrientationEvent.requestPermission !== "function") {
         window.addEventListener("deviceorientation", handleOrientation);
         setPermissionGranted(true);
       }
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  const triggerPermission = async () => {
     // @ts-ignore
     if (typeof DeviceOrientationEvent.requestPermission === "function") {
       // @ts-ignore
       const response = await DeviceOrientationEvent.requestPermission();
       setPermissionGranted(response === "granted");
       if (response === "granted") {
         // Re-attach listener if granted
         const handleOrientation = (event: DeviceOrientationEvent) => {
           setData({
             alpha: event.alpha,
             beta: event.beta,
             gamma: event.gamma,
           });
         };
         window.addEventListener("deviceorientation", handleOrientation);
       }
     }
  };

  return { data, permissionGranted, triggerPermission };
}
