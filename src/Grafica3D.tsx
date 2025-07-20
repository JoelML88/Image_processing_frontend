import Plot from "react-plotly.js";
import { useEffect, useState } from "react";
import "./Grafica3D.css";

interface Punto {
  compactness_factor: number;
  relative_area_bbox_percent: number;
  unique_color_int: number;
  clase: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Grafica3D() {
  const [puntos, setPuntos] = useState<Punto[]>([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/grafica-entrenamiento`)
      .then(res => res.json())
      .then(data => setPuntos(data.puntos))
      .catch(err => console.error(err));
  }, []);

  const clasesUnicas = Array.from(new Set(puntos.map(p => p.clase)));

  const trazas = clasesUnicas.map(clase => {
    const puntosDeClase = puntos.filter(p => p.clase === clase);
    return {
      x: puntosDeClase.map(p => p.compactness_factor),
      y: puntosDeClase.map(p => p.relative_area_bbox_percent),
      z: puntosDeClase.map(p => p.unique_color_int),
      text: puntosDeClase.map(p =>
        `Clase: ${p.clase}<br>Compactness: ${p.compactness_factor.toFixed(2)}<br>Área Relativa: ${p.relative_area_bbox_percent.toFixed(2)}%`
      ),
      mode: "markers",
      type: "scatter3d",
      name: clase,
      marker: { size: 5 },
    };
  });

  // Cálculo de promedios (prototipos)
  const trazasPrototipos = clasesUnicas.map(clase => {
    const puntosDeClase = puntos.filter(p => p.clase === clase);
    const n = puntosDeClase.length;

    const promedio = puntosDeClase.reduce(
      (acc, p) => {
        acc.x += p.compactness_factor;
        acc.y += p.relative_area_bbox_percent;
        acc.z += p.unique_color_int;
        return acc;
      },
      { x: 0, y: 0, z: 0 }
    );

    const x = promedio.x / n;
    const y = promedio.y / n;
    const z = promedio.z / n;

    function getRandomColor(): string {
      const letters = '0123456789ABCDEF';
      return '#' + Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * 16)]).join('');
    }
    
    function getRandomSymbol(): string {
      const symbols = [
        'circle', 'square', 'diamond', 'cross', 'x', 'triangle-up', 'triangle-down',
        'triangle-left', 'triangle-right', 'star', 'hexagram', 'hourglass', 'bowtie'
      ];
      return symbols[Math.floor(Math.random() * symbols.length)];
    }
    
    // Dentro de tu función de retorno:
    return {
      x: [x],
      y: [y],
      z: [z],
      type: "scatter3d",
      mode: "markers+text",
      name: `Prototipo ${clase}`,
      text: [`Prototipo ${clase}`],
      textposition: "top center",
      marker: {
        size: 10,
        color: getRandomColor(),      // 🎨 color aleatorio
        symbol: getRandomSymbol(),    // 🔷 forma aleatoria
        line: {
          color: "#fff",
          width: 2,
        },
      },
    };
    




  });

  return (
    <div className="grafica3d-container">
      <h2>Gráfica 3D del Entrenamiento</h2>
      <p className="axis-info">
        Ejes: Compactness Factor, Área Relativa %, Color único combinado
      </p>

      <div className="plot-wrapper">
        <Plot
          data={[...trazas, ...trazasPrototipos]}
          layout={{
            autosize: true,
            title: "Distribución en Espacio de Características",
            scene: {
              xaxis: { title: { text: "Compactness Factor" } },
              yaxis: { title: { text: "Área Relativa (%)" } },
              zaxis: { title: { text: "Color único (RGB combinado)" } },
            },
            legend: {
              orientation: "h",
              y: -0.2,
            },
            margin: { l: 0, r: 0, b: 0, t: 40 },
          }}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
}
