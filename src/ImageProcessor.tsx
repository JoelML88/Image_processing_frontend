import React, { useState, useEffect } from "react";
import CameraCapture from "./components/CameraCapture";
import ImageUpload from "./components/ImageUpload";
import ImageResults from "./components/ImageResults";
import ImageModal from "./components/ImageModal";

import "./ImageProcessor.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<{ src: string; label: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoplayDelay, setAutoplayDelay] = useState<number>(1000);

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false); // ✅ nuevo estado

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  useEffect(() => {
    if (!modalOpen || !autoPlay) return;
    const timer = setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % modalImages.length);
    }, autoplayDelay);
    return () => clearTimeout(timer);
  }, [modalOpen, autoPlay, currentIndex, modalImages.length, autoplayDelay]);

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

  function mostrarMensaje(texto: string, duracion = 5000) {
    setMensaje(texto);
    setTimeout(() => setMensaje(null), duracion);
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
        mostrarMensaje("Error al subir una imagen.");
      }
    }
    setUploadingIndex(-1);
    mostrarMensaje("Todas las imágenes fueron enviadas correctamente.");
  }

  async function pollStatus() {
    const ids = Object.keys(processStatus);

    if (ids.length === 0) {
      mostrarMensaje("No hay procesos para consultar.");
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
        mostrarMensaje("Error al consultar estado.");
      }
    }
    mostrarMensaje("Consulta de estado completada.");
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

  function handleCapture(file: File) {
    handleFiles({ 0: file, length: 1, item: () => file } as unknown as FileList);
  }

  // ✅ Confirmar limpieza
  function handleClearAll() {
    // Libera los previews actuales
    previews.forEach((url) => URL.revokeObjectURL(url));
    // Limpia todo
    setFiles([]);
    setPreviews([]);
    setClassName("");
    setThreshold(220);
    setUploadingIndex(-1);
    setProcessStatus({});
    setResults({});
    setModalOpen(false);
    setModalImages([]);
    setAutoPlay(false);
    setCurrentIndex(0);
    setMensaje(null);
    setAutoplayDelay(1000);
    setConfirmClear(false);
    mostrarMensaje("La interfaz fue limpiada.");
  }

  return (
    <div className="image-processor">
      <h2>Procesamiento de Imágenes</h2>

      <CameraCapture onCapture={handleCapture} />
      <ImageUpload previews={previews} onRemove={removeImage} onFilesSelected={handleFiles} />

      <div className="controls">
        <label>
          Class Name:&nbsp;
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="manzana"
          />
        </label>
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
        <label>
          Autoplay Delay (ms):&nbsp;
          <input
            type="number"
            value={autoplayDelay}
            onChange={(e) => setAutoplayDelay(Number(e.target.value))}
            min={100}
            step={100}
            placeholder="1000"
          />
        </label>
      </div>

      <div className="button-group">
        <button
          onClick={uploadImages}
          disabled={uploadingIndex !== -1 || files.length === 0 || !className}>
          {uploadingIndex === -1
            ? "Enviar imágenes"
            : `Enviando imagen ${uploadingIndex + 1} de ${files.length}`}
        </button>
        <button onClick={pollStatus}>Consultar estado</button>
        <button onClick={() => setConfirmClear(true)} className="danger">Limpiar todo</button>
      </div>

      <ImageResults results={results} onImageClick={openModalWithImages} />

      {modalOpen && (
        <ImageModal
          images={modalImages}
          currentIndex={currentIndex}
          autoPlay={autoPlay}
          onClose={closeModal}
          onNext={nextImage}
          onPrev={prevImage}
          onToggleAutoPlay={() => setAutoPlay((a) => !a)}
        />
      )}

      {mensaje && (
        <div className="modal-mensaje-overlay">
          <div className="modal-mensaje">
            <p>{mensaje}</p>
            <button onClick={() => setMensaje(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {confirmClear && (
        <div className="modal-mensaje-overlay">
          <div className="modal-mensaje">
            <p>¿Estás seguro de que deseas limpiar toda la interfaz?</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={handleClearAll} className="danger">Aceptar</button>
              <button onClick={() => setConfirmClear(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
