import React from "react";
import { useSearchParams } from "react-router-dom";
import "./Fillereg.css";
import logoImg from "../assets/cropped-Logo-Abayo-Co.-Advocates.png";

type CaseType =
  | "civil"
  | "labor"
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

  labor: {
    label: "Labor Case",
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
    // matches the printed form: "R/B Nº", "File nº: RP", "File nº: RPAA"
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

  return "labor";
}

interface PartyProps {
  type: string;
  title: string;
  nameLabel?: string;
  repLabel?: string;
}

const PartySection: React.FC<PartyProps> = ({
  type,
  title,
  nameLabel,
  repLabel = "Represented by",
}) => {
  const prefix = type;

  return (
    <>
      <div className="subsection-title">{title}</div>

      <div className="form-row">
        {nameLabel && <span>{nameLabel}</span>}

        <input
          required
          autoComplete="off"
          type="text"
          id={`${prefix}_name`}
          name={`${prefix}_name`}
          className="line-input"
        />

        <span>and</span>

        <input
          type="text"
          id={`${prefix}_and`}
          name={`${prefix}_and`}
          className="line-input"
        />
      </div>

      <div className="form-row">
        <input
          type="text"
          id={`${prefix}_parent`}
          name={`${prefix}_parent`}
          className="line-input"
        />

        <span>daughter / son of</span>

        <input
          type="text"
          id={`${prefix}_parents_names`}
          name={`${prefix}_parents_names`}
          className="line-input"
        />
      </div>

      <div className="form-row">
        <input
          type="text"
          id={`${prefix}_occupation`}
          name={`${prefix}_occupation`}
          className="line-input"
        />

        <span>born on</span>

        <input
          type="text"
          id={`${prefix}_dob_d`}
          name={`${prefix}_dob_d`}
          className="line-input input-fixed-sm"
        />

        <span>/</span>

        <input
          type="text"
          id={`${prefix}_dob_m`}
          name={`${prefix}_dob_m`}
          className="line-input input-fixed-sm"
        />

        <span>/</span>

        <input
          type="text"
          id={`${prefix}_dob_y`}
          name={`${prefix}_dob_y`}
          className="line-input input-fixed-sm"
        />

        <span>, resident of</span>

        <input
          type="text"
          id={`${prefix}_residence`}
          name={`${prefix}_residence`}
          className="line-input"
        />

        <span>Village</span>
      </div>

      <div className="form-row">
        <input
          type="text"
          id={`${prefix}_village`}
          name={`${prefix}_village`}
          className="line-input"
        />

        <span>Cell,</span>

        <input
          type="text"
          id={`${prefix}_cell`}
          name={`${prefix}_cell`}
          className="line-input"
        />

        <span>Sector,</span>

        <input
          type="text"
          id={`${prefix}_sector`}
          name={`${prefix}_sector`}
          className="line-input"
        />

        <span>District,</span>

        <input
          type="text"
          id={`${prefix}_district`}
          name={`${prefix}_district`}
          className="line-input"
        />
      </div>

      <div className="form-row">
        <input
          type="text"
          id={`${prefix}_province`}
          name={`${prefix}_province`}
          className="line-input"
        />

        <span>Province. Email</span>

        <input
          type="email"
          id={`${prefix}_email`}
          name={`${prefix}_email`}
          className="line-input"
        />
      </div>

      <div className="form-row">
        <span>ID Nº/Pass Nº</span>

        <input
          type="text"
          id={`${prefix}_id_pass`}
          name={`${prefix}_id_pass`}
          className="line-input"
        />

        <span>P. O. Box</span>

        <input
          type="text"
          id={`${prefix}_po_box`}
          name={`${prefix}_po_box`}
          className="line-input"
        />

        <span>Phone nº</span>

        <input
          type="text"
          id={`${prefix}_phone`}
          name={`${prefix}_phone`}
          className="line-input input-fixed-md"
        />
      </div>

      <div className="form-row">
        <span>{repLabel}</span>

        <input
          type="text"
          id={`${prefix}_rep`}
          name={`${prefix}_rep`}
          className="line-input"
        />

        <span>Phone nº</span>

        <input
          type="text"
          id={`${prefix}_rep_phone`}
          name={`${prefix}_rep_phone`}
          className="line-input input-fixed-md"
        />
      </div>
    </>
  );
};

const ProsecutionSection: React.FC = () => (
  <>
    <div className="subsection-title">PLAINTIFF</div>

    <div className="form-row">
      <span>Prosecution:</span>

      <input
        type="text"
        id="prosecution"
        name="prosecution"
        className="line-input"
      />
    </div>
  </>
);

const AccusedSection: React.FC<{ index: number }> = ({ index }) => (
  <PartySection
    type={`accused_${index}`}
    title="ACCUSED:"
    nameLabel="Names:"
    repLabel="Assisted by"
  />
);

const CivilPartySection: React.FC = () => (
  <PartySection
    type="civil_party"
    title="CIVIL PARTY:"
    nameLabel="Names:"
    repLabel="Represented by"
  />
);

const CompanySection: React.FC = () => (
  <>
    <div className="subsection-title">COMPANY</div>

    <div className="form-row">
      <span>Company Name:</span>
      <input
        type="text"
        id="company_name"
        name="company_name"
        className="line-input"
      />
      <span>Represented by</span>
      <input
        type="text"
        id="company_rep"
        name="company_rep"
        className="line-input"
      />
    </div>

    <div className="form-row">
      <span>HQs:</span>
      <input
        type="text"
        id="company_village"
        name="company_village"
        className="line-input"
      />
      <span>Cell,</span>
      <input
        type="text"
        id="company_cell"
        name="company_cell"
        className="line-input"
      />
      <span>Sector,</span>
      <input
        type="text"
        id="company_sector"
        name="company_sector"
        className="line-input"
      />
    </div>

    <div className="form-row">
      <span>District,</span>
      <input
        type="text"
        id="company_district"
        name="company_district"
        className="line-input"
      />
      <span>Province,</span>
      <input
        type="text"
        id="company_province"
        name="company_province"
        className="line-input"
      />
      <span>P. O. Box</span>
      <input
        type="text"
        id="company_po_box"
        name="company_po_box"
        className="line-input"
      />
    </div>

    <div className="form-row">
      <span>Email</span>
      <input
        type="email"
        id="company_email"
        name="company_email"
        className="line-input"
      />
      <span>TIN:</span>
      <input
        type="text"
        id="company_tin"
        name="company_tin"
        className="line-input"
      />
    </div>

    <div className="form-row">
      <span>Office Phone nº</span>
      <input
        type="text"
        id="company_office_phone"
        name="company_office_phone"
        className="line-input input-fixed-md"
      />
      <span>Mobile Phone nº</span>
      <input
        type="text"
        id="company_mobile_phone"
        name="company_mobile_phone"
        className="line-input input-fixed-md"
      />
    </div>
  </>
);

const IndividualSection: React.FC = () => (
  <PartySection
    type="individual"
    title="INDIVIDUAL"
    nameLabel="Names:"
    repLabel="Represented by"
  />
);

const Fillereg: React.FC = () => {
  const [searchParams] = useSearchParams();

  const fullName = searchParams.get("fullName");
  const dep = searchParams.get("dep");
  const fileType = searchParams.get("fileType");

  const currentCaseType = getCaseType(fileType);
  const caseConfig = CASE_TYPES[currentCaseType];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const data = Object.fromEntries(formData.entries());

    console.log("Case data:", data);
    console.log("Full name:", fullName);
    console.log("Department:", dep);
    console.log("File type:", currentCaseType);
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
              id="aca_file_no"
              name="aca_file_no"
              className="line-input input-fixed-md"
            />

            <span>/ {caseConfig.tag} /</span>

            <input
              type="text"
              id="lab_file_no"
              name="lab_file_no"
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
                id="domain"
                name="domain"
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
                    className="line-input"
                  />

                  <span>/</span>

                  <input
                    type="text"
                    name={`${currentCaseType}_${index}_2`}
                    className="line-input"
                  />

                  <span>/</span>

                  <input
                    type="text"
                    name={`${currentCaseType}_${index}_3`}
                    className="line-input"
                  />
                </div>
              ))}
            </div>
          )}

          {/* PARTIES - layout depends on case type */}

          {caseConfig.partiesLayout === "standard" && (
            <>
              <div className="section-title">PARTIES INVOLVED</div>

              <PartySection type="plaintiff" title="PLAINTIFF / APPELLANT:" />

              <PartySection type="defendant" title="DEFENDANT / RESPONDENT:" />

              <PartySection
                type="intervener"
                title="VOLUNTARY / FORCED INTERVENTION:"
              />
            </>
          )}

          {caseConfig.partiesLayout === "criminal" && (
            <>
              <div className="section-title">PARTIES INVOLVED</div>

              <ProsecutionSection />
              <AccusedSection index={1} />
              <AccusedSection index={2} />
              <CivilPartySection />
            </>
          )}

          {caseConfig.partiesLayout === "consultancy" && (
            <>
              <CompanySection />
              <IndividualSection />
            </>
          )}

          {/* OBJECT / OFFENSE / ASSIGNMENT */}

          {caseConfig.objectCount > 0 && (
            <>
              <div className="subsection-title">
                {caseConfig.objectLabel.toUpperCase()}:
              </div>

              <ul className="object-list">
                {Array.from({
                  length: caseConfig.objectCount,
                }).map((_, index) => (
                  <li key={index}>
                    <span>{index + 1}.</span>

                    <input
                      type="text"
                      id={`case_object_${index + 1}`}
                      name={`case_object_${index + 1}`}
                      className="line-input"
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* COURT DETAILS */}

          {caseConfig.footer === "court" && (
            <div className="details-section">
              <div className="form-row">
                <span>COURT :</span>

                <input
                  type="text"
                  id="court_name"
                  name="court_name"
                  className="line-input"
                />

                <span>
                  1<sup>st</sup>
                </span>

                <input
                  type="text"
                  id="court_1st_instance"
                  name="court_1st_instance"
                  className="line-input"
                />

                <span>
                  2<sup>nd</sup> Appeal
                </span>

                <input
                  type="text"
                  id="court_2nd_appeal"
                  name="court_2nd_appeal"
                  className="line-input"
                />
              </div>

              <div className="form-row">
                <span>DATE OF HEARING :</span>

                <input
                  type="date"
                  id="date_of_hearing"
                  name="date_of_hearing"
                  className="line-input"
                />
              </div>

              <div className="form-row">
                <span>VERDICT DELIVERY :</span>

                <input
                  type="date"
                  id="verdict_delivery"
                  name="verdict_delivery"
                  className="line-input"
                />

                <span>Date of Appeal</span>

                <input
                  type="date"
                  id="date_of_appeal"
                  name="date_of_appeal"
                  className="line-input input-fixed-md"
                />
              </div>

              <div className="form-row">
                <span>ADVOCATE ASSIGNED:</span>

                <input
                  type="text"
                  id="advocate_assigned"
                  name="advocate_assigned"
                  className="line-input"
                />

                <span>Phone nº</span>

                <input
                  type="text"
                  id="advocate_phone"
                  name="advocate_phone"
                  className="line-input input-fixed-md"
                />
              </div>
            </div>
          )}

          {/* CONSULTANCY DETAILS */}

          {caseConfig.footer === "consultancy" && (
            <div className="details-section">
              <div className="form-row">
                <span>RECEIVED ON :</span>

                <input
                  type="date"
                  id="received_on"
                  name="received_on"
                  className="line-input"
                />
              </div>

              <div className="form-row">
                <span>DEADLINE :</span>

                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  className="line-input"
                />
              </div>

              <div className="form-row">
                <span>ADVOCATE ASSIGNED:</span>

                <input
                  type="text"
                  id="advocate_assigned"
                  name="advocate_assigned"
                  className="line-input"
                />

                <span>Phone nº</span>

                <input
                  type="text"
                  id="advocate_phone"
                  name="advocate_phone"
                  className="line-input input-fixed-md"
                />
              </div>
            </div>
          )}

          {/* FOOTER */}

          <div className="footer">www.abayo.law</div>
        </div>
      </form>
      <div>
        <button type="submit" form="caseForm" className="submit-button">
          Submit Case
        </button>
      </div>
    </div>
  );
};

export default Fillereg;
