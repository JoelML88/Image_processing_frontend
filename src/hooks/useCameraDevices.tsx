import { useState, useEffect } from "react";

export default function useCameraDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    async function fetchDevices() {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);
      } catch (err) {
        console.error("Error fetching media devices", err);
      }
    }
    fetchDevices();
  }, []);

  return devices;
}
