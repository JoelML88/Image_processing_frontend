import { useState } from "react";
import ImageProcessor from "./ImageProcessor";
import RegionClassifier from "./RegionClassifier";
import Grafica3D from "./Grafica3D";
import './App.css';

export default function App() {
  const [pagina, setPagina] = useState<"procesar" | "clasificar" | "grafica">("procesar");

  return (
    <div style={{ maxWidth: 1000, margin: "auto" }}>
      <nav style={{ marginBottom: 20 }}>
        <button onClick={() => setPagina("procesar")}>Procesar Imágenes</button>
        <button onClick={() => setPagina("clasificar")} style={{ marginLeft: 10 }}>
          Clasificar Regiones
        </button>
        <button onClick={() => setPagina("grafica")} style={{ marginLeft: 10 }}>
          Gráfica Entrenamiento
        </button>
        
      </nav>

      {pagina === "procesar" && <ImageProcessor />}
      {pagina === "clasificar" && <RegionClassifier />}
      {pagina === "grafica" && <Grafica3D />}
    </div>
  );
}
