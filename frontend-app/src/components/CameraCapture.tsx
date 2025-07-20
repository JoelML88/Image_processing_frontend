import React, { useEffect, useRef, useState } from "react";

interface Props {
  onCapture: (file: File) => void;
}

export default function CameraCapture({ onCapture }: Props) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cargar dispositivos al montar el componente
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((allDevices) => {
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    });
  }, []);

  useEffect(() => {
    if (cameraActive) {
      initCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraActive, selectedDeviceId]);

  async function initCamera() {
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, advanced: [{ torch: true }] }
          : { facingMode: "environment", advanced: [{ torch: true }] },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accediendo a la cámara:", err);
      setCameraActive(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function toggleCamera() {
    setCameraActive(!cameraActive);
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture_${Date.now()}.png`, { type: "image/png" });
      onCapture(file);
    }, "image/png");
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 10 }}>
        <label>Selecciona cámara:&nbsp;</label>
        <select
          value={selectedDeviceId || ""}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          disabled={cameraActive}
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Cámara ${d.deviceId}`}
            </option>
          ))}
        </select>
      </div>

      <button onClick={toggleCamera} style={{ marginRight: 10 }}>
        {cameraActive ? "Detener Cámara" : "Iniciar Cámara"}
      </button>

      {cameraActive && (
        <>
          <button onClick={capturePhoto}>Capturar Imagen</button>
          <div style={{ marginTop: 10 }}>
            <video
              ref={videoRef}
              style={{ width: "100%", maxHeight: 300, backgroundColor: "#000" }}
              muted
              playsInline
            />
          </div>
        </>
      )}
    </div>
  );
}
