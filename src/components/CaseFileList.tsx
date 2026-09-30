import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CASE_TYPES, type CaseType } from "./caseTypes";
import CaseFileCard, { type CaseFileSummary } from "./Casefilecard";
import "./CaseFileList.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const CASE_FILES_ENDPOINT = `${API_BASE}/api/case-files`;

type FilterValue = "all" | CaseType;

const CaseFileList: React.FC = () => {
  const navigate = useNavigate();

  const [files, setFiles] = useState<CaseFileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterValue>("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Reset to page 1 when search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadCaseFiles() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(CASE_FILES_ENDPOINT, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: CaseFileSummary[] = await response.json();

        if (!cancelled) {
          setFiles(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load case files.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCaseFiles();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter and sort all matching files
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => typeFilter === "all" || file.fileType === typeFilter)
      .filter((file) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
          file.reference?.toLowerCase().includes(q) ||
          file.courtCaseNumber?.toLowerCase().includes(q) ||
          file.partyOne?.toLowerCase().includes(q) ||
          file.partyTwo?.toLowerCase().includes(q) ||
          file.createdBy?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  }, [files, search, typeFilter]);

  // Total pages calculation
  const totalPages = Math.max(
    1,
    Math.ceil(filteredFiles.length / itemsPerPage),
  );

  // Ensure current page doesn't exceed total pages if dataset changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Paginated slice of filtered files
  const visibleFiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFiles, currentPage, itemsPerPage]);

  const handleOpenFile = (file: CaseFileSummary) => {
    navigate(`/case-files/${file.fileType}/${file.id}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Helper to generate dynamic page numbers with ellipsis (e.g. 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("…");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem =
    filteredFiles.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredFiles.length);

  return (
    <div className="case-file-list">
      <div className="case-file-list-toolbar">
        <input
          type="text"
          placeholder="Search by reference nº, party or advocate…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="case-file-search"
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as FilterValue)}
          className="case-file-filter"
        >
          <option value="all">All case types</option>
          {(Object.keys(CASE_TYPES) as CaseType[]).map((key) => (
            <option key={key} value={key}>
              {CASE_TYPES[key].label}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="case-file-list-status">Loading case files…</div>
      )}

      {!loading && error && (
        <div className="case-file-list-status case-file-list-error">
          Couldn't load case files: {error}
        </div>
      )}

      {!loading && !error && filteredFiles.length === 0 && (
        <div className="case-file-list-status">
          {files.length === 0
            ? "No case files have been created yet."
            : "No case files match your search."}
        </div>
      )}

      {!loading && !error && filteredFiles.length > 0 && (
        <>
          <div className="case-file-grid">
            {visibleFiles.map((file) => (
              <CaseFileCard
                key={`${file.fileType}-${file.id}`}
                file={file}
                onClick={handleOpenFile}
              />
            ))}
          </div>

          {/* Pagination Bar */}
          <div className="case-file-pagination">
            <div className="case-file-pagination-info">
              Showing {startItem}–{endItem} of {filteredFiles.length} case files
            </div>

            <div className="case-file-pagination-controls">
              <button
                type="button"
                className="case-file-pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <div className="case-file-pagination-numbers">
                {getPageNumbers().map((page, idx) =>
                  typeof page === "number" ? (
                    <button
                      key={idx}
                      type="button"
                      className={`case-file-page-number ${
                        page === currentPage ? "active" : ""
                      }`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={idx} className="case-file-page-ellipsis">
                      {page}
                    </span>
                  ),
                )}
              </div>

              <button
                type="button"
                className="case-file-pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>

            <div className="case-file-pagination-per-page">
              <label htmlFor="itemsPerPage">Per page: </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={9}>9</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CaseFileList;
