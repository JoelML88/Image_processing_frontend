import React from "react";

interface ModalImage {
  src: string;
  label: string;
}

interface Props {
  images: ModalImage[];
  currentIndex: number;
  autoPlay: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleAutoPlay: () => void;
}

export default function ImageModal({
  images,
  currentIndex,
  autoPlay,
  onClose,
  onNext,
  onPrev,
  onToggleAutoPlay,
}: Props) {
  if (images.length === 0) return null;

  return (
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
      onClick={onClose}
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
          src={images[currentIndex].src}
          alt={images[currentIndex].label}
          style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 6 }}
        />
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <div style={{ marginBottom: 8, fontWeight: "bold", fontSize: 16 }}>
            {images[currentIndex].label}
          </div>
          <button onClick={onPrev} style={{ marginRight: 10 }}>
            ← Anterior
          </button>
          <button onClick={onNext} style={{ marginRight: 10 }}>
            Siguiente →
          </button>
          <button onClick={onToggleAutoPlay} style={{ marginRight: 10 }}>
            {autoPlay ? "Pausar" : "Auto Play"}
          </button>
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
