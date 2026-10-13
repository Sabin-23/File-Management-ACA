import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./Fillereg.css";
import logoImg from "../assets/cropped-Logo-Abayo-Co.-Advocates.png";
import { authClient } from "../lib/auth";

type CaseType =
  | "civil"
  | "labour"
  | "administrative"
  | "commercial"
  | "arbitration"
  | "criminal"
  | "consultancy";

type PartiesLayout = "standard" | "criminal" | "consultancy";

interface FileNumberConfig {
  label: string;
}

interface CaseConfig {
  label: string;
  tag: string;
  color: string;
  fileNumbers: FileNumberConfig[];
  objectLabel: string;
  objectCount: number;
  footer: "court" | "arbitration" | "consultancy";
  partiesLayout: PartiesLayout;
}

const fileNums = (labels: string[]): FileNumberConfig[] =>
  labels.map((label) => ({ label }));

const CASE_TYPES: Record<CaseType, CaseConfig> = {
  civil: {
    label: "Civil Case",
    tag: "CIV",
    color: "#9FDDC7",
    fileNumbers: fileNums(["File nº: RC", "File nº: RCA", "File nº: RCAA"]),
    objectLabel: "Object of the Case",
    objectCount: 4,
    footer: "court",
    partiesLayout: "standard",
  },
  labour: {
    label: "Labour Case",
    tag: "LAB",
    color: "#BFE29A",
    fileNumbers: fileNums([
      "File nº: RLAB",
      "File nº: RLABA",
      "File nº: RLABAA",
    ]),
    objectLabel: "Object of the Case",
    objectCount: 4,
    footer: "court",
    partiesLayout: "standard",
  },
  administrative: {
    label: "Administrative Case",
    tag: "ADM",
    color: "#F5A55D",
    fileNumbers: fileNums(["File nº: RAD", "File nº: RADA", "File nº: RADAA"]),
    objectLabel: "Object of the Case",
    objectCount: 4,
    footer: "court",
    partiesLayout: "standard",
  },
  commercial: {
    label: "Commercial Case",
    tag: "COM",
    color: "#EAD27A",
    fileNumbers: fileNums([
      "File nº: RCOM",
      "File nº: RCOMA",
      "File nº: RCOMAA",
    ]),
    objectLabel: "Object of the Case",
    objectCount: 4,
    footer: "court",
    partiesLayout: "standard",
  },
  arbitration: {
    label: "Arbitration File",
    tag: "ARB",
    color: "#C9C7C2",
    fileNumbers: fileNums(["File nº: ARB"]),
    objectLabel: "Object of the Case",
    objectCount: 3,
    footer: "arbitration",
    partiesLayout: "standard",
  },
  criminal: {
    label: "Criminal Case",
    tag: "CRIM",
    color: "#F2B9C4",
    fileNumbers: fileNums(["R/B Nº", "File nº: RP", "File nº: RPAA"]),
    objectLabel: "Offense Committed",
    objectCount: 4,
    footer: "court",
    partiesLayout: "criminal",
  },
  consultancy: {
    label: "Consultancy File",
    tag: "CONS",
    color: "#EFE7D2",
    fileNumbers: [],
    objectLabel: "Assignment",
    objectCount: 4,
    footer: "consultancy",
    partiesLayout: "consultancy",
  },
};

function getCaseType(fileType: string | null): CaseType {
  if (fileType && fileType in CASE_TYPES) {
    return fileType as CaseType;
  }
  return "labour";
}

interface PartyProps {
  type: string;
  title: string;
  nameLabel?: string;
  repLabel?: string;
  readOnly?: boolean;
  initialData?: Record<string, any>;
}

const PartySection: React.FC<PartyProps> = ({
  type,
  title,
  nameLabel,
  repLabel = "Represented by",
  readOnly,
  initialData = {},
}) => {
  const prefix = type;
  const val = (field: string) => initialData[`${prefix}_${field}`] || "";

  return (
    <>
      <div className="subsection-title">{title}</div>

      <div className="form-row">
        {nameLabel && <span>{nameLabel}</span>}
        <input
          required={!readOnly}
          autoComplete="off"
          type="text"
          name={`${prefix}_name`}
          defaultValue={val("name")}
          readOnly={readOnly}
          className="line-input"
        />
        <span>and</span>
        <input
          type="text"
          name={`${prefix}_and`}
          defaultValue={val("and")}
          readOnly={readOnly}
          className="line-input"
        />
      </div>

      <div className="form-row">
        <input
          type="text"
          name={`${prefix}_parent`}
          defaultValue={val("parent")}
          readOnly={readOnly}
          className="line-input"
        />
        <span>daughter / son of</span>
        <input
          type="text"
          name={`${prefix}_parents_names`}
          defaultValue={val("parents_names")}
          readOnly={readOnly}
          className="line-input"
        />
      </div>

      <div className="form-row">
        <input
          type="text"
          name={`${prefix}_occupation`}
          defaultValue={val("occupation")}
          readOnly={readOnly}
          className="line-input"
        />
        <span>born on</span>
        <input
          type="text"
          name={`${prefix}_dob_d`}
          defaultValue={val("dob_d")}
          readOnly={readOnly}
          className="line-input input-fixed-sm"
        />
        <span>/</span>
        <input
          type="text"
          name={`${prefix}_dob_m`}
          defaultValue={val("dob_m")}
          readOnly={readOnly}
          className="line-input input-fixed-sm"
        />
        <span>/</span>
        <input
          type="text"
          name={`${prefix}_dob_y`}
          defaultValue={val("dob_y")}
          readOnly={readOnly}
          className="line-input input-fixed-sm"
        />
        <span>, resident of</span>
        <input
          type="text"
          name={`${prefix}_residence`}
          defaultValue={val("residence")}
          readOnly={readOnly}
          className="line-input"
        />
        <span>Village</span>
      </div>

      <div className="form-row">
        <input
          type="text"
          name={`${prefix}_village`}
          defaultValue={val("village")}
          readOnly={readOnly}
          className="line-input"
        />
        <span>Cell,</span>
        <input
          type="text"
          name={`${prefix}_cell`}
          defaultValue={val("cell")}
          readOnly={readOnly}
          className="line-input"
        />
        <span>Sector,</span>
        <input
          type="text"
          name={`${prefix}_sector`}
          defaultValue={val("sector")}
          readOnly={readOnly}
          className="line-input"
        />
        <span>District,</span>
        <input
          type="text"
          name={`${prefix}_district`}
          defaultValue={val("district")}
          readOnly={readOnly}
          className="line-input"
        />
      </div>

      <div className="form-row">
        <input
          type="text"
          name={`${prefix}_province`}
          defaultValue={val("province")}
          readOnly={readOnly}
          className="line-input"
        />
        <span>Province. Email</span>
        <input
          type="email"
          name={`${prefix}_email`}
          defaultValue={val("email")}
          readOnly={readOnly}
          className="line-input"
        />
      </div>

      <div className="form-row">
        <span>ID Nº/Pass Nº</span>
        <input
          type="text"
          name={`${prefix}_id_pass`}
          defaultValue={val("id_pass")}
          readOnly={readOnly}
          className="line-input"
        />
        <span>P. O. Box</span>
        <input
          type="text"
          name={`${prefix}_po_box`}
          defaultValue={val("po_box")}
          readOnly={readOnly}
          className="line-input"
        />
        <span>Phone nº</span>
        <input
          type="text"
          name={`${prefix}_phone`}
          defaultValue={val("phone")}
          readOnly={readOnly}
          className="line-input input-fixed-md"
        />
      </div>

      <div className="form-row">
        <span>{repLabel}</span>
        <input
          type="text"
          name={`${prefix}_rep`}
          defaultValue={val("rep")}
          readOnly={readOnly}
          className="line-input"
        />
        <span>Phone nº</span>
        <input
          type="text"
          name={`${prefix}_rep_phone`}
          defaultValue={val("rep_phone")}
          readOnly={readOnly}
          className="line-input input-fixed-md"
        />
      </div>
    </>
  );
};

interface FilleregProps {
  readOnly?: boolean;
  initialData?: Record<string, any>;
  onClose?: () => void;
  onSubmit?: (data: Record<string, any>) => Promise<void>;
}

const Fillereg: React.FC<FilleregProps> = ({
  readOnly = false,
  initialData = {},
  onClose,
  onSubmit,
}) => {
  const [searchParams] = useSearchParams();

  const fullName = searchParams.get("fullName");
  const dep = searchParams.get("dep");
  const fileType = initialData.fileType || searchParams.get("fileType");

  const currentCaseType = getCaseType(fileType);
  const caseConfig = CASE_TYPES[currentCaseType];

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) return;

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      if (onSubmit) {
        await onSubmit(data);
        setSubmitSuccess(true);
        return;
      }
      const { data: sessionData } = await authClient.getSession();
      const token = sessionData?.session?.token;

      if (!token) {
        throw new Error("You are signed out. Please sign in again.");
      }

      const response = await fetch(`/api/case-files/${currentCaseType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...data, fullName, dep }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || `Request failed with status ${response.status}`,
        );
      }

      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save case file.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fillereg-page">
      <form id="caseForm" onSubmit={handleSubmit} className="fillereg-form">
        <div
          className="document-page"
          style={{
            backgroundColor: caseConfig.color,
          }}
        >
          {/* HEADER */}
          <div className="header-left">
            <div className="logo-box">
              <img src={logoImg} alt="Abayo & Co. Advocates" />
            </div>
          </div>
          <div className="header">
            <div className="header-info-left">
              <div>P.O. Box 4170, Kigali - Rwanda</div>
              <div>TIN & VAT : 103455746</div>
            </div>
            <div className="header-info-right">
              <div>Mobile Phone: +250 788 300 075</div>
              <div>Office Phone : +250 788 300 535</div>
            </div>
            <div className="header-info-right">
              <div>Email : info@abayo.law</div>
              <div>Website : www.abayo.law</div>
            </div>
          </div>

          {/* SERVICES */}
          <div className="services-banner">
            Corporate & Commercial; Legal advisory & consultancy; Dispute
            Resolution; Real Estate, Infrastructure & Natural Resources; IP &
            Technology; Notary Services
          </div>

          {/* REFERENCE */}
          <div className="case-ref">
            <span>ACA FILE Nº :</span>
            <input
              type="text"
              name="aca_file_no"
              defaultValue={initialData.aca_file_no}
              readOnly={readOnly}
              className="line-input input-fixed-md"
            />
            <span>/ {caseConfig.tag} /</span>
            <input
              type="text"
              name="lab_file_no"
              defaultValue={initialData.lab_file_no}
              readOnly={readOnly}
              className="line-input"
            />
          </div>

          {/* TITLE */}
          <div className="case-title">{caseConfig.label}</div>

          {/* DOMAIN - consultancy only */}
          {currentCaseType === "consultancy" && (
            <div className="form-row">
              <span>DOMAIN:</span>
              <input
                type="text"
                name="domain"
                defaultValue={initialData.domain}
                readOnly={readOnly}
                className="line-input"
              />
            </div>
          )}

          {/* FILE NUMBERS */}
          {caseConfig.fileNumbers.length > 0 && (
            <div className="file-numbers">
              {caseConfig.fileNumbers.map((fileNumber, index) => (
                <div className="file-row" key={fileNumber.label}>
                  <span>{fileNumber.label}</span>
                  <input
                    type="text"
                    name={`${currentCaseType}_${index}_1`}
                    defaultValue={initialData[`${currentCaseType}_${index}_1`]}
                    readOnly={readOnly}
                    className="line-input"
                  />
                  <span>/</span>
                  <input
                    type="text"
                    name={`${currentCaseType}_${index}_2`}
                    defaultValue={initialData[`${currentCaseType}_${index}_2`]}
                    readOnly={readOnly}
                    className="line-input"
                  />
                  <span>/</span>
                  <input
                    type="text"
                    name={`${currentCaseType}_${index}_3`}
                    defaultValue={initialData[`${currentCaseType}_${index}_3`]}
                    readOnly={readOnly}
                    className="line-input"
                  />
                </div>
              ))}
            </div>
          )}

          {/* PARTIES */}
          {caseConfig.partiesLayout === "standard" && (
            <>
              <div className="section-title">PARTIES INVOLVED</div>
              <PartySection
                type="plaintiff"
                title="PLAINTIFF / APPELLANT:"
                readOnly={readOnly}
                initialData={initialData}
              />
              <PartySection
                type="defendant"
                title="DEFENDANT / RESPONDENT:"
                readOnly={readOnly}
                initialData={initialData}
              />
              <PartySection
                type="intervener"
                title="VOLUNTARY / FORCED INTERVENTION:"
                readOnly={readOnly}
                initialData={initialData}
              />
            </>
          )}

          {caseConfig.partiesLayout === "criminal" && (
            <>
              <div className="section-title">PARTIES INVOLVED</div>
              <div className="subsection-title">PLAINTIFF</div>
              <div className="form-row">
                <span>Prosecution:</span>
                <input
                  type="text"
                  name="prosecution"
                  defaultValue={initialData.prosecution}
                  readOnly={readOnly}
                  className="line-input"
                />
              </div>
              <PartySection
                type="accused_1"
                title="ACCUSED:"
                nameLabel="Names:"
                repLabel="Assisted by"
                readOnly={readOnly}
                initialData={initialData}
              />
              <PartySection
                type="accused_2"
                title="ACCUSED:"
                nameLabel="Names:"
                repLabel="Assisted by"
                readOnly={readOnly}
                initialData={initialData}
              />
              <PartySection
                type="civil_party"
                title="CIVIL PARTY:"
                nameLabel="Names:"
                repLabel="Represented by"
                readOnly={readOnly}
                initialData={initialData}
              />
            </>
          )}

          {caseConfig.partiesLayout === "consultancy" && (
            <>
              {/* Company & Individual sections can use initialData similarly */}
            </>
          )}

          {/* OBJECT */}
          {caseConfig.objectCount > 0 && (
            <>
              <div className="subsection-title">
                {caseConfig.objectLabel.toUpperCase()}:
              </div>
              <ul className="object-list">
                {Array.from({ length: caseConfig.objectCount }).map(
                  (_, index) => (
                    <li key={index}>
                      <span>{index + 1}.</span>
                      <input
                        type="text"
                        name={`case_object_${index + 1}`}
                        defaultValue={initialData[`case_object_${index + 1}`]}
                        readOnly={readOnly}
                        className="line-input"
                      />
                    </li>
                  ),
                )}
              </ul>
            </>
          )}

          {/* FOOTER DETAILS */}
          {caseConfig.footer === "court" && (
            <div className="details-section">
              <div className="form-row">
                <span>COURT :</span>
                <input
                  type="text"
                  name="court_name"
                  defaultValue={initialData.court_name}
                  readOnly={readOnly}
                  className="line-input"
                />
                <span>
                  1<sup>st</sup>
                </span>
                <input
                  type="text"
                  name="court_1st_instance"
                  defaultValue={initialData.court_1st_instance}
                  readOnly={readOnly}
                  className="line-input"
                />
                <span>
                  2<sup>nd</sup> Appeal
                </span>
                <input
                  type="text"
                  name="court_2nd_appeal"
                  defaultValue={initialData.court_2nd_appeal}
                  readOnly={readOnly}
                  className="line-input"
                />
              </div>
              <div className="form-row">
                <span>DATE OF HEARING :</span>
                <input
                  type="date"
                  name="date_of_hearing"
                  defaultValue={initialData.date_of_hearing}
                  readOnly={readOnly}
                  className="line-input"
                />
              </div>
              <div className="form-row">
                <span>VERDICT DELIVERY :</span>
                <input
                  type="date"
                  name="verdict_delivery"
                  defaultValue={initialData.verdict_delivery}
                  readOnly={readOnly}
                  className="line-input"
                />
                <span>Date of Appeal</span>
                <input
                  type="date"
                  name="date_of_appeal"
                  defaultValue={initialData.date_of_appeal}
                  readOnly={readOnly}
                  className="line-input input-fixed-md"
                />
              </div>
              <div className="form-row">
                <span>ADVOCATE ASSIGNED:</span>
                <input
                  type="text"
                  name="advocate_assigned"
                  defaultValue={initialData.advocate_assigned}
                  readOnly={readOnly}
                  className="line-input"
                />
                <span>Phone nº</span>
                <input
                  type="text"
                  name="advocate_phone"
                  defaultValue={initialData.advocate_phone}
                  readOnly={readOnly}
                  className="line-input input-fixed-md"
                />
              </div>
            </div>
          )}

          <div className="footer">www.abayo.law</div>
        </div>
      </form>

      {/* FOOTER ACTIONS */}
      <div className="submit-container">
        {readOnly ? (
          <div style={{ display: "grid", flexDirection: "row", gap: "10px" }}>
            <button
              type="button"
              className="submit-button"
              onClick={() => window.print()}
            >
              Print / Save PDF
            </button>
            {onClose && (
              <button
                type="button"
                className="submit-button"
                style={{ backgroundColor: "#64748b" }}
                onClick={onClose}
              >
                Close
              </button>
            )}
          </div>
        ) : (
          <>
            {submitError && (
              <div className="status-message error-message">
                <span>{submitError}</span>
              </div>
            )}
            {submitSuccess && (
              <div className="status-message success-message">
                <span>Case file saved successfully.</span>
              </div>
            )}
            <button
              type="submit"
              form="caseForm"
              className={`submit-button ${submitting ? "loading" : ""}`}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Submit Case File"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Fillereg;
