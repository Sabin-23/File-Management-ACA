import React from "react";
import { CASE_TYPES, getCaseType } from "./caseTypes";
import "./Casefilecard.css";

export interface CaseFileSummary {
  id: string;
  fileType: string;
  caseNumber?: number;
  partialCase?: string;
  courtCaseNumber?: string;
  partyOne?: string;
  partyTwo?: string;
  year?: number;
  /** Advocate initials */
  createdBy?: string;
}

interface CaseFileCardProps {
  file: CaseFileSummary;
  onClick?: (file: CaseFileSummary) => void;
}

const CaseFileCard: React.FC<CaseFileCardProps> = ({ file, onClick }) => {
  const caseType = getCaseType(file.fileType);
  const config = CASE_TYPES[caseType];

  return (
    <button
      type="button"
      className="case-file-card"
      style={{ borderTopColor: config.color }}
      onClick={() => onClick?.(file)}
    >
      <div
        className="case-file-card-badge"
        style={{ backgroundColor: config.color }}
      >
        {config.tag}
      </div>

      <div className="case-file-card-body">
        <div className="case-file-card-type">{config.label}</div>

        <div className="case-file-card-ref">{`ACA ${file.caseNumber || null}/${file.partialCase || null}`}</div>

        {file.courtCaseNumber && (
          <div className="case-file-card-court-ref">
            Court nº: {file.courtCaseNumber}
          </div>
        )}

        {(file.partyOne || file.partyTwo) && (
          <div className="case-file-card-parties">
            {file.partyOne && <span>{file.partyOne}</span>}
            {file.partyOne && file.partyTwo && <span className="vs"> vs </span>}
            {file.partyTwo && <span>{file.partyTwo}</span>}
          </div>
        )}

        <div className="case-file-card-meta">
          {file.year && <span>{file.year}</span>}
          {file.createdBy && <span>· {file.createdBy}</span>}
        </div>
      </div>
    </button>
  );
};

export default CaseFileCard;
