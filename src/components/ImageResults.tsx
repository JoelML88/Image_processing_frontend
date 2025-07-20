import React from "react";

interface ResultData {
  [key: string]: any;
}

interface Props {
  results: Record<string, ResultData>;
  onImageClick: (data: ResultData) => void;
}

const IMAGE_KEYS = [
  "grayscale_image_b64",
  "median_filtered_image_b64",
  "binary_image_b64",
  "kmeans_segmented_image_b64",
  "inverted_binary_image_b64",
  "R_masked_image_b64",
  "G_masked_image_b64",
  "B_masked_image_b64",
];

export default function ImageResults({ results, onImageClick }: Props) {
  return (
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
          onClick={() => onImageClick(data)}
          title="Click para ver imágenes grandes"
        >
          <p>
            <b>Proceso ID:</b> {id}
          </p>
          <p>
            <b>Status:</b> {data.status}
          </p>
          <p>
            <b>Dimensiones:</b> {data.dimensions_H} x {data.dimensions_W} x {data.dimensions_C}
          </p>
          <p>
            <b>Compactness Factor:</b> {data.compactness_factor?.toFixed(2)}
          </p>
          <p>
            <b>Color Int:</b> {data.unique_color_int}
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {IMAGE_KEYS.map(
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
  );
}
