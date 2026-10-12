import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Fillereg from "../pages/Fillereg";
import { authClient } from "../lib/auth";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function CaseFileViewPage() {
  const { fileType, id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCaseDetails() {
      try {
        const { data: sessionData } = await authClient.getSession();
        const token = sessionData?.session?.token;

        if (!token) {
          throw new Error("You are signed out. Please sign in again.");
        }

        const response = await fetch(`${API_BASE}/api/case-files`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch case details.");

        const files = await response.json();

        const rawCase = files.find(
          (f: any) => String(f.id) === String(id) && f.fileType === fileType,
        );

        if (!rawCase) {
          throw new Error("Case file not found.");
        }

        const mappedData = {
          ...rawCase,
          fileType: rawCase.fileType,
          lab_file_no: rawCase.year || "",
          aca_file_no: rawCase.caseNumber || "",
          plaintiff_name: rawCase.partyOne || "",
          defendant_name: rawCase.partyTwo || "",
          advocate_assigned: rawCase.createdBy || "",
        };

        setCaseData(mappedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
    }

    fetchCaseDetails();
  }, [fileType, id]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        Loading case document...
      </div>
    );
  if (error)
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "red" }}>
        {error}
      </div>
    );

  return (
    <div>
      <Fillereg
        readOnly={true}
        initialData={caseData || {}}
        onClose={() => navigate(-1)}
      />
    </div>
  );
}
