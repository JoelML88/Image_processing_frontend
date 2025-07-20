import React from "react";
import "./ImageUpload.css";

interface Props {
  previews: string[];
  onRemove: (index: number) => void;
  onFilesSelected: (files: FileList) => void;
}


export default function ImageUpload({ previews, onRemove, onFilesSelected }: Props) {
  return (
    <>
      <div
        className="image-upload"
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesSelected(e.dataTransfer.files);
            e.dataTransfer.clearData();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        Arrastra carpetas o imágenes aquí, o usa el selector
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
          className="image-upload-input"
          {...({ webkitdirectory: "true", directory: "true" } as any)}
        />
      </div>

      <div className="image-preview-container">
        {previews.map((src, i) => (
          <div key={i} className="image-preview">
            <img
              src={src}
              alt={`preview-${i}`}
              className="image-preview-img"
            />
            <button
              onClick={() => onRemove(i)}
              className="remove-button"
              title="Eliminar imagen"
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
