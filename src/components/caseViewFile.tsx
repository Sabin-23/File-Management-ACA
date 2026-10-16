import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Fillereg from "../pages/Fillereg";
import { authClient } from "../lib/auth";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function CaseFileViewPage() {
  const { fileType, id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<Record<string, any> | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNewAdvocate, setSelectedNewAdvocate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch user session and role directly from authClient
        const { data: sessionData } = await authClient.getSession();
        const token = sessionData?.session?.token;
        const role = sessionData?.user?.role;

        if (!token)
          throw new Error("You are signed out. Please sign in again.");

        setUserRole(role || "user");

        // 2. Fetch case details from API
        const response = await fetch(`${API_BASE}/api/case-files`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch case details.");

        const files = await response.json();
        const rawCase = files.find(
          (f: any) => String(f.id) === String(id) && f.fileType === fileType,
        );

        if (!rawCase) throw new Error("Case file not found.");

        const isCriminal = rawCase.fileType === "criminal";
        const mappedData = {
          ...rawCase,
          fileType: rawCase.fileType,
          lab_file_no: rawCase.year || "",
          aca_file_no: rawCase.caseNumber || "",
          plaintiff_name: rawCase.partyOne || "",
          defendant_name: rawCase.partyTwo || "",
          advocate_assigned: rawCase.createdBy || "",
          prosecution: isCriminal ? rawCase.partyOne || "" : "",
          accused_1_name: isCriminal ? rawCase.partyTwo || "" : "",
          civil_party_name: isCriminal ? rawCase.civil_party || "" : "",
          individual_name: rawCase.individual || "",
          company_name: rawCase.company || "",
          case_object_1: rawCase.assignments || "",
        };

        setCaseData(mappedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [fileType, id]);

  // Handle Deleting a File
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this case file?"))
      return;

    try {
      const { data: sessionData } = await authClient.getSession();
      const token = sessionData?.session?.token;

      const res = await fetch(`${API_BASE}/api/case-files/${fileType}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete file.");
      }

      navigate(-1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Deletion failed.");
    }
  };

  // Handle Transferring a File by Advocate Full Name
  const handleTransfer = async () => {
    if (!selectedNewAdvocate.trim()) {
      return alert("Please enter the full name of the advocate.");
    }

    try {
      const { data: sessionData } = await authClient.getSession();
      const token = sessionData?.session?.token;

      const res = await fetch(
        `${API_BASE}/api/case-files/${fileType}/${id}/transfer`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ advocateName: selectedNewAdvocate.trim() }),
        },
      );

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to transfer file.");
      }

      // Update locally assigned advocate initials in Fillereg view
      setCaseData((prev) =>
        prev ? { ...prev, advocate_assigned: responseData.initials } : prev,
      );

      setActionMessage(
        `File successfully transferred to ${responseData.assignedTo} (${responseData.initials})!`,
      );
      setSelectedNewAdvocate("");
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Transfer failed.");
    }
  };

  const handleUpdate = async (updatedFormData: Record<string, any>) => {
    try {
      const { data: sessionData } = await authClient.getSession();
      const token = sessionData?.session?.token;

      if (!token) {
        throw new Error("You are signed out. Please sign in again.");
      }

      const res = await fetch(`${API_BASE}/api/case-files/${fileType}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedFormData),
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to update case file.");
      }

      // Exit edit mode after successful update
      setIsEditing(false);
      setActionMessage("Case file updated successfully!");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      throw err; // Rethrowing lets Fillereg's internal state display the error message
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        Loading case document...
      </div>
    );

  if (error)
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#dc2626" }}>
        {error}
      </div>
    );

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "50px" }}>
      {/* Action Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          background: "#f8fafc",
          padding: "12px 20px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            style={{
              background: isEditing ? "#64748b" : "#1a365d",
              color: "#ffffff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {isEditing ? "Cancel Edit" : "Edit File"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            style={{
              background: "#dc2626",
              color: "#ffffff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Delete File
          </button>
        </div>

        {/* Transfer Section (Visible to Admins Only) */}
        {userRole === "admin" && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span
              style={{ fontSize: "14px", fontWeight: "500", color: "#334155" }}
            >
              Transfer File:
            </span>
            <input
              type="text"
              placeholder="Advocate Full Name"
              value={selectedNewAdvocate}
              onChange={(e) => setSelectedNewAdvocate(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                width: "180px",
              }}
            />
            <button
              type="button"
              onClick={handleTransfer}
              style={{
                background: "#0d9488",
                color: "#ffffff",
                border: "none",
                padding: "7px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Reassign
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {actionMessage && (
        <div
          style={{
            marginBottom: "15px",
            padding: "10px 16px",
            background: "#f0fdf4",
            color: "#166534",
            borderRadius: "6px",
            border: "1px solid #bbf7d0",
            fontWeight: "500",
          }}
        >
          {actionMessage}
        </div>
      )}

      {/* Main Document Form */}
      <Fillereg
        readOnly={!isEditing}
        initialData={caseData || {}}
        onClose={() => navigate(-1)}
        onSubmit={isEditing ? handleUpdate : undefined}
      />
    </div>
  );
}
