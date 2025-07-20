import React, { useRef, useState, useEffect } from "react";
import "./RegionClassifier.css";

interface Region {
  bbox: [number, number, number, number];
  region_image_b64: string;
}

interface ObjetosDetectados {
  regiones: number;
  detalles: Region[];
}

interface RespuestaBackend {
  objetos_detectados: ObjetosDetectados;
  proceso_id: string;
}

interface ConteoClases {
  [clase: string]: number;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function RegionClassifier() {
  const [conteo, setConteo] = useState<ConteoClases>({});
  const [imagenURL, setImagenURL] = useState<string | null>(null);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [clasesPorRegion, setClasesPorRegion] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    cargarImagenEnCanvas();
  }, [imagenURL, clasesPorRegion]);

  async function procesarImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setConteo({});
    setImagenURL(URL.createObjectURL(file));
    setRegiones([]);
    setClasesPorRegion([]);

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${BACKEND_URL}/test-image`, { method: "POST", body: formData });
    const data: RespuestaBackend = await res.json();
    console.log(data);

    const nuevoConteo: ConteoClases = {};
    const nuevasClases: string[] = [];

    for (const region of data.objetos_detectados.detalles) {
      const clase = await clasificarRegion(region.region_image_b64);
      nuevoConteo[clase] = (nuevoConteo[clase] || 0) + 1;
      nuevasClases.push(clase);
    }

    setConteo(nuevoConteo);
    setRegiones(data.objetos_detectados.detalles);
    setClasesPorRegion(nuevasClases);
  }

  async function clasificarRegion(b64: string) {
    const blob = b64ToBlob(b64, "image/jpeg");
    const formData = new FormData();
    formData.append("file", blob, "region.jpg");

    const res = await fetch(`${BACKEND_URL}/test-knn-image`, { method: "POST", body: formData });
    const data = await res.json();
    console.log(data);
    return data.prediccion_clase || "desconocida";
  }

  function b64ToBlob(b64Data: string, contentType = ""): Blob {
    const byteCharacters = atob(b64Data.split(",")[1] || b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = Array.from(slice).map((c) => c.charCodeAt(0));
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType });
  }

  function cargarImagenEnCanvas() {
    const canvas = canvasRef.current;
    if (!canvas || !imagenURL) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      regiones.forEach((region, index) => {
        const [x1, y1, x2, y2] = region.bbox;
        ctx.strokeStyle = "#ef4444"; /* rojo moderno */
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        const texto = clasesPorRegion[index] || "";
        ctx.font = "bold 16px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        ctx.fillStyle = "#ef4444";
        ctx.fillText(texto, x1 + 6, y1 + 20);
      });
    };
    img.src = imagenURL;
  }

  return (
    <div className="region-classifier-container">
      <h2>Clasificador de Regiones</h2>
      <input
        type="file"
        accept="image/*"
        onChange={procesarImagen}
        className="file-input"
      />
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="canvas-display" />
      </div>

      <h3>Conteo de Clases:</h3>
      <ul className="class-count-list">
        {Object.entries(conteo).map(([clase, cantidad]) => (
          <li key={clase}>
            <strong>{clase}:</strong> {cantidad}
          </li>
        ))}
      </ul>

      <h3>Regiones Detectadas:</h3>
      <div className="detected-regions-grid">
        {regiones.map((region, idx) => (
          <div key={idx} className="region-preview">
            <img
              src={`data:image/jpeg;base64,${region.region_image_b64}`}
              alt={`region-${idx}`}
              className="region-image"
            />
            <div className="region-label">
              <p>Clase:</p>
              <span>{clasesPorRegion[idx]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
