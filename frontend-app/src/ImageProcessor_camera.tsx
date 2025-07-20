import React, { useState, useEffect, useRef } from "react";


const BACKEND_URL = "https://192.168.100.88:8000";

interface ProcessStatus {
  [proceso_id: string]: any;
}

interface Results {
  [proceso_id: string]: any;
}

export default function ImageProcessor() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [className, setClassName] = useState<string>("");
  const [threshold, setThreshold] = useState<number>(220);

  const [uploadingIndex, setUploadingIndex] = useState<number>(-1);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>({});
  const [results, setResults] = useState<Results>({});

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<{ src: string; label: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  // Cámara
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Limpiar URLs antiguas para evitar memory leaks
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      stopCamera();
    };
  }, [previews]);

  // Obtener dispositivos de video disponibles
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((allDevices) => {
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    });
  }, []);

  // Arrancar o detener cámara según cambios
  useEffect(() => {
    if (showCamera && selectedDeviceId) {
      startCamera(selectedDeviceId);
    } else {
      stopCamera();
    }
  }, [showCamera, selectedDeviceId]);

  // Efecto autoplay modal
  useEffect(() => {
    if (!modalOpen || !autoPlay) return;
    const timer = setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % modalImages.length);
    }, 1000);
    return () => clearTimeout(timer);
  }, [modalOpen, autoPlay, currentIndex, modalImages.length]);

  function handleFiles(selectedFiles: FileList) {
    const arrFiles = Array.from(selectedFiles);
    setFiles((prev) => [...prev, ...arrFiles]);
    const urls = arrFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  }

  function removeImage(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  function startCamera(deviceId: string) {
    stopCamera();
    navigator.mediaDevices
      .getUserMedia({ video: { deviceId: { exact: deviceId } } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
        setShowCamera(false);
      });
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.png`, { type: "image/png" });
          handleFiles({ 0: file, length: 1, item: () => file } as unknown as FileList);
        }
      }, "image/png");
    }
  }

  async function uploadImages() {
    for (let i = 0; i < files.length; i++) {
      setUploadingIndex(i);

      const formData = new FormData();
      formData.append("image", files[i]);
      formData.append(
        "metadata",
        JSON.stringify({
          class_name: className,
          threshold_value: Number(threshold),
        })
      );

      try {
        const res = await fetch(`${BACKEND_URL}/process-image/`, {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (json.proceso_id) {
          setProcessStatus((prev) => ({
            ...prev,
            [json.proceso_id]: { status: "procesando" },
          }));
        }
      } catch (err) {
        console.error("Error uploading:", err);
      }
    }
    setUploadingIndex(-1);
  }

  async function pollStatus() {
    const ids = Object.keys(processStatus);
    if (ids.length === 0) {
      alert("No hay procesos para consultar");
      return;
    }
    for (const id of ids) {
      try {
        const res = await fetch(`${BACKEND_URL}/estado/${id}`);
        const data = await res.json();
        setProcessStatus((prev) => ({ ...prev, [id]: data }));
        if (data.status === "completado") {
          setResults((prev) => ({ ...prev, [id]: data }));
        }
      } catch (err) {
        console.error("Error polling status:", err);
      }
    }
  }

  function openModalWithImages(data: any) {
    const keys = [
      "grayscale_image_b64",
      "median_filtered_image_b64",
      "binary_image_b64",
      "kmeans_segmented_image_b64",
      "inverted_binary_image_b64",
      "R_masked_image_b64",
      "G_masked_image_b64",
      "B_masked_image_b64",
    ];

    const imgs = keys
      .filter((k) => data[k])
      .map((k) => ({
        src: `data:image/png;base64,${data[k]}`,
        label: k.replace("_image_b64", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      }));

    setModalImages(imgs);
    setCurrentIndex(0);
    setModalOpen(true);
    setAutoPlay(false);
  }

  function closeModal() {
    setModalOpen(false);
    setModalImages([]);
    setAutoPlay(false);
  }

  function nextImage() {
    setCurrentIndex((i) => (i + 1) % modalImages.length);
  }

  function prevImage() {
    setCurrentIndex((i) => (i - 1 + modalImages.length) % modalImages.length);
  }

  return (
    <div style={{ maxWidth: 700, margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Procesamiento de imágenes</h2>

      {/* Cámara */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setShowCamera((s) => !s)} style={{ marginRight: 10 }}>
          {showCamera ? "Cerrar Cámara" : "Abrir Cámara"}
        </button>
        {showCamera && (
          <>
            <select
              value={selectedDeviceId || ""}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              style={{ marginRight: 10 }}
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Cámara ${d.deviceId}`}
                </option>
              ))}
            </select>
            <button onClick={capturePhoto}>Capturar Imagen</button>
            <div style={{ marginTop: 10 }}>
              <video ref={videoRef} style={{ width: "100%", maxHeight: 300 }} muted playsInline />
            </div>
          </>
        )}
      </div>

      {/* Drag & Drop y selector archivos */}
      <div
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: "2px dashed #999",
          padding: 20,
          textAlign: "center",
          marginBottom: 20,
          cursor: "pointer",
        }}
      >
        Arrastra carpetas o imágenes aquí, o usa el selector
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          style={{ display: "block", margin: "10px auto" }}
          {...{ webkitdirectory: "true", directory: "true" } as any}
        />
      </div>

      {/* Previews con botón eliminar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {previews.map((src, i) => (
          <div key={i} style={{ position: "relative" }}>
            <img
              src={src}
              alt={`preview-${i}`}
              width={80}
              height={80}
              style={{ objectFit: "cover", borderRadius: 5 }}
            />
            <button
              onClick={() => removeImage(i)}
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                backgroundColor: "red",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 20,
                height: 20,
                cursor: "pointer",
                fontSize: 12,
                lineHeight: "16px",
              }}
              title="Eliminar imagen"
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Form inputs */}
      <div style={{ marginBottom: 20 }}>
        <label>
          Class Name:&nbsp;
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="manzana"
          />
        </label>
        <br />
        <label>
          Threshold Value:&nbsp;
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            min={0}
            max={255}
          />
        </label>
      </div>

      {/* Botones subir y consultar estado */}
      <button
        onClick={uploadImages}
        disabled={uploadingIndex !== -1 || files.length === 0 || !className}
      >
        {uploadingIndex === -1 ? "Enviar imágenes" : `Enviando imagen ${uploadingIndex + 1} de ${files.length}`}
      </button>

      <button onClick={pollStatus} style={{ marginLeft: 20 }}>
        Consultar estado
      </button>

      {/* Resultados procesados */}
      <div style={{ marginTop: 30 }}>
        <h3>Resultados procesados:</h3>
        {Object.entries(results).length === 0 && <p>No hay resultados aún.</p>}
        {Object.entries(results).map(([id, data]) => (
          <div
            key={id}
            style={{
              border: "1px solid #ddd",
              padding: 10,
              marginBottom: 10,
              cursor: "pointer",
            }}
            onClick={() => openModalWithImages(data)}
            title="Click para ver imágenes grandes"
          >
            <p><b>Proceso ID:</b> {id}</p>
            <p><b>Status:</b> {data.status}</p>
            <p>
              <b>Dimensiones:</b> {data.dimensions_H} x {data.dimensions_W} x {data.dimensions_C}
            </p>
            <p><b>Compactness Factor:</b> {data.compactness_factor?.toFixed(2)}</p>
            <p><b>Color Int:</b> {data.unique_color_int}</p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                "grayscale_image_b64",
                "median_filtered_image_b64",
                "binary_image_b64",
                "kmeans_segmented_image_b64",
                "inverted_binary_image_b64",
                "R_masked_image_b64",
                "G_masked_image_b64",
                "B_masked_image_b64",
              ].map(
                (key) =>
                  data[key] && (
                    <div
                      key={key}
                      style={{
                        marginRight: 10,
                        marginTop: 10,
                        textAlign: "center",
                        display: "inline-block",
                      }}
                    >
                      <img
                        src={`data:image/png;base64,${data[key]}`}
                        alt={key}
                        width={100}
                        style={{
                          borderRadius: 4,
                          border: "1px solid #ccc",
                          display: "block",
                          marginBottom: 4,
                          objectFit: "cover",
                        }}
                      />
                      <small style={{ fontSize: 12, color: "#555" }}>
                        {key
                          .replace("_image_b64", "")
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </small>
                    </div>
                  )
              )}
            </div>
          </div>
        ))}
      </div>
           
      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 8,
              boxShadow: "0 0 15px #000",
              userSelect: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={modalImages[currentIndex].src}
              alt={modalImages[currentIndex].label}
              style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 6 }}
            />
            <div style={{ marginTop: 10, textAlign: "center" }}>
              <div style={{ marginBottom: 8, fontWeight: "bold", fontSize: 16 }}>
                {modalImages[currentIndex].label}
              </div>
              <button onClick={prevImage} style={{ marginRight: 10 }}>
                ← Anterior
              </button>
              <button onClick={nextImage} style={{ marginRight: 10 }}>
                Siguiente →
              </button>
              <button
                onClick={() => setAutoPlay((a) => !a)}
                style={{ marginRight: 10 }}
              >
                {autoPlay ? "Pausar" : "Auto Play"}
              </button>
              <button onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
    }
