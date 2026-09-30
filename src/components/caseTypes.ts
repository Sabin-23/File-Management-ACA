export type CaseType =
  | "civil"
  | "labor"
  | "administrative"
  | "commercial"
  | "arbitration"
  | "criminal"
  | "consultancy";

export type PartiesLayout = "standard" | "criminal" | "consultancy";

export interface FileNumberConfig {
  /** Full label text as printed on the form, e.g. "File nº: RC" or "R/B Nº" */
  label: string;
}

export interface CaseConfig {
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

export const CASE_TYPES: Record<CaseType, CaseConfig> = {
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
    fileNumbers: fileNums(["File nº: RLAB", "File nº: RLABA", "File nº: RLABAA"]),
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
    fileNumbers: fileNums(["File nº: RCOM", "File nº: RCOMA", "File nº: RCOMAA"]),
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

export function getCaseType(fileType: string | null | undefined): CaseType {
  if (fileType && fileType in CASE_TYPES) {
    return fileType as CaseType;
  }
  return "labor";
}