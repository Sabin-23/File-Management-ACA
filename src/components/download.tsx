import { useState } from "react";
import { authClient } from "../lib/auth";
import { API_BASE } from "../config";

const CASE_TYPES = [
  { key: "civil", label: "Civil Cases" },
  { key: "labour", label: "Labour Cases" },
  { key: "administrative", label: "Administrative Cases" },
  { key: "commercial", label: "Commercial Cases" },
  { key: "arbitration", label: "Arbitration Files" },
  { key: "criminal", label: "Criminal Cases" },
  { key: "consultancy", label: "Consultancy Files" },
];

export default function ExcelExportModal({
  onClose,
}: {
  onClose?: () => void;
}) {
  const [selectedType, setSelectedType] = useState("labour");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      const { data: sessionData } = await authClient.getSession();
      const token = sessionData?.session?.token;

      if (!token) {
        throw new Error("You are signed out. Please sign in again.");
      }

      const response = await fetch(
        `${API_BASE}/api/case-files/export/${selectedType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to export Excel file.");
      }

      // Convert response into a Blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedType}_cases_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      if (onClose) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="export-modal"
      style={{
        padding: "20px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        maxWidth: "400px",
        margin: "20px auto",
      }}
    >
      <h3>Export Case Table to Excel</h3>
      <p style={{ fontSize: "14px", color: "#666" }}>
        Select which case category you want to download:
      </p>

      <div style={{ marginBottom: "15px" }}>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          {CASE_TYPES.map((type) => (
            <option key={type.key} value={type.key}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ color: "red", fontSize: "13px", marginBottom: "10px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "#e2e8f0",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          style={{
            padding: "8px 16px",
            background: "#790000",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {downloading ? "Generating Excel..." : "Download Excel"}
        </button>
      </div>
    </div>
  );
}
