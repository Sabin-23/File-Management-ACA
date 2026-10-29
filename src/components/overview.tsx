import { useCallback, useEffect, useState } from "react";
import type { FocusEvent, PointerEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth";
import { CASE_TYPES } from "./caseTypes";
import "./overview.css";
import { API_BASE } from "../config";

/* ---------- Types (match server/routes/dashboard.js) ---------- */

interface RecentFile {
  id: string;
  fileType: string;
  caseNumber?: string;
  partialCase?: string;
  partyOne?: string;
  partyTwo?: string;
  year?: number;
  createdBy?: string;
}

interface Dashboard {
  scope: "user" | "admin";
  generatedAt: string;
  totals: {
    files: number;
    thisYear: number;
    lastYear: number;
    undated: number;
    currentYear: number;
  };
  byType: { fileType: string; count: number }[];
  byYear: { year: number; count: number }[];
  earlier: number;
  recent: RecentFile[];
  // admin only
  team?: { advocatesWithFiles: number; registeredUsers: number };
  unassigned?: number;
  byAdvocate?: {
    advocateId: string;
    name: string;
    initials: string | null;
    files: number;
    thisYear: number;
  }[];
  otherAdvocates?: { advocates: number; files: number };
}

type Scope = "firm" | "mine";

interface OverviewProps {
  /** Called by the empty-state button. */
  onNewFile?: () => void;
  /** Called by "Browse all files". */
  onBrowseFiles?: () => void;
}

/* ---------- Small helpers ---------- */

const fmt = (n: number) => new Intl.NumberFormat("en").format(n);
const plural = (n: number, one: string, many = `${one}s`) =>
  `${fmt(n)} ${n === 1 ? one : many}`;

function typeMeta(fileType: string): { label: string; tag: string } {
  const known = (
    CASE_TYPES as Record<string, { label: string; tag: string } | undefined>
  )[fileType];
  if (known) return { label: known.label, tag: known.tag };
  const label = fileType.charAt(0).toUpperCase() + fileType.slice(1);
  return { label, tag: fileType.slice(0, 3).toUpperCase() };
}

function isAdminRole(role: string | null | undefined): boolean {
  return (role ?? "").split(",").some((r) => r.trim() === "admin");
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function deltaText(now: number, before: number, beforeYear: number): string {
  if (now === 0 && before === 0) return `None dated ${beforeYear} either`;
  if (now === before) return `Same as ${beforeYear}`;
  const d = Math.abs(now - before);
  return now > before
    ? `▲ ${fmt(d)} more than ${beforeYear}`
    : `▼ ${fmt(d)} fewer than ${beforeYear}`;
}

function reference(f: RecentFile): string {
  const number = f.caseNumber ?? "—";
  return `ACA ${number}${f.partialCase ? `/${f.partialCase}` : ""}`;
}

/* ---------- Tooltip (one for the whole page) ---------- */

interface TipContent {
  title: string;
  value: string;
  note?: string;
}
type Tip = (TipContent & { x: number; y: number }) | null;

function useTip() {
  const [tip, setTip] = useState<Tip>(null);

  // Props for any mark: hover, keyboard focus, and a tab stop.
  const mark = (content: TipContent) => ({
    tabIndex: 0,
    onPointerMove: (e: PointerEvent<HTMLElement>) =>
      setTip({ x: e.clientX, y: e.clientY, ...content }),
    onPointerLeave: () => setTip(null),
    onFocus: (e: FocusEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setTip({ x: r.left + r.width / 2, y: r.top, ...content });
    },
    onBlur: () => setTip(null),
  });

  const node = tip ? (
    <div
      className="ov-tip"
      role="tooltip"
      style={{
        left: Math.min(Math.max(tip.x, 100), window.innerWidth - 100),
        top: tip.y,
      }}
    >
      <div className="ov-tip-value">
        <i className="ov-key" aria-hidden="true" />
        {tip.value}
      </div>
      <div className="ov-tip-title">{tip.title}</div>
      {tip.note && <div className="ov-tip-note">{tip.note}</div>}
    </div>
  ) : null;

  return { mark, node };
}

/* ---------- Card chrome with Chart | Table switch ---------- */

interface TableData {
  head: string[];
  rows: (string | number)[][];
}

function ChartCard(props: {
  title: string;
  sub: string;
  table: TableData;
  className?: string;
  children: ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <section className={`ov-card ${props.className ?? ""}`}>
      <header className="ov-card-head">
        <div>
          <h3>{props.title}</h3>
          <p>{props.sub}</p>
        </div>
        <div className="ov-seg" role="group" aria-label={`${props.title} view`}>
          <button
            type="button"
            aria-pressed={view === "chart"}
            onClick={() => setView("chart")}
          >
            Chart
          </button>
          <button
            type="button"
            aria-pressed={view === "table"}
            onClick={() => setView("table")}
          >
            Table
          </button>
        </div>
      </header>

      {view === "chart" ? (
        props.children
      ) : (
        <table className="ov-table">
          <thead>
            <tr>
              {props.table.head.map((h, i) => (
                <th key={h} className={i > 0 ? "num" : undefined}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, i) => (
                  <td key={i} className={i > 0 ? "num" : undefined}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/* ---------- Charts ---------- */

type MarkFn = ReturnType<typeof useTip>["mark"];

/** Ranked horizontal bars: label on the left, value at the tip of the bar. */
function RankedBars(props: {
  rows: {
    key: string;
    tag: string;
    label: string;
    count: number;
    note?: string;
  }[];
  unit: string;
  mark: MarkFn;
}) {
  const max = Math.max(1, ...props.rows.map((r) => r.count));
  return (
    <ul className="ov-bars" role="list">
      {props.rows.map((r) => {
        const pct = (r.count / max) * 88; // leave room for the value at the tip
        return (
          <li
            key={r.key}
            className={`ov-bar-row${r.count === 0 ? " is-zero" : ""}`}
            aria-label={`${r.label}: ${plural(r.count, props.unit)}`}
            {...props.mark({
              title: r.label,
              value: plural(r.count, props.unit),
              note: r.note,
            })}
          >
            <span className="ov-bar-label">
              <span className="ov-code">{r.tag}</span>
              <span className="ov-bar-name">{r.label}</span>
            </span>
            <span className="ov-bar-track">
              {r.count > 0 && (
                <span className="ov-bar-fill" style={{ width: `${pct}%` }} />
              )}
              <span
                className="ov-bar-value"
                style={{ left: `calc(${r.count > 0 ? pct : 0}% + 8px)` }}
              >
                {fmt(r.count)}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** One column per year; the current year is the accent, the rest are context. */
function YearColumns(props: {
  years: { year: number; count: number }[];
  currentYear: number;
  mark: MarkFn;
}) {
  const max = Math.max(1, ...props.years.map((y) => y.count));
  return (
    <div className="ov-cols" role="list">
      {props.years.map((y) => (
        <div
          key={y.year}
          role="listitem"
          className={`ov-col${y.year === props.currentYear ? " is-current" : ""}`}
          aria-label={`${y.year}: ${plural(y.count, "file")}`}
          {...props.mark({
            title: String(y.year),
            value: plural(y.count, "file"),
          })}
        >
          <span className="ov-col-plot">
            <span
              className="ov-col-stack"
              style={{ height: `${(y.count / max) * 100}%` }}
            >
              <span className="ov-col-value">{fmt(y.count)}</span>
              <span className="ov-col-bar" />
            </span>
          </span>
          <span className="ov-col-year">{y.year}</span>
        </div>
      ))}
    </div>
  );
}

/** Hero sparkline: files per year. Decorative; the numbers are in the text. */
function Spark({ series }: { series: number[] }) {
  const w = 230;
  const h = 58;
  const pad = 6;
  const max = Math.max(1, ...series);
  const pts = series.map((v, i) => {
    const x =
      series.length === 1
        ? w / 2
        : pad + (i * (w - pad * 2)) / (series.length - 1);
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const last = pts[pts.length - 1];
  const area = `${line} L${last[0]},${h} L${pts[0][0]},${h} Z`;
  return (
    <svg
      className="ov-spark"
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d={area} fill="currentColor" opacity="0.12" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="4"
        fill="#f4e9e5"
        stroke="#4c0e1a"
        strokeWidth="2"
      />
    </svg>
  );
}

/* ---------- Sections ---------- */

function Hero({ data, title }: { data: Dashboard; title: string }) {
  const typesInUse = data.byType.filter((t) => t.count > 0).length;
  return (
    <section className="ov-hero" aria-label={title}>
      <div className="ov-hero-text">
        <span className="ov-hero-label">{title}</span>
        <span className="ov-hero-value">{fmt(data.totals.files)}</span>
        <span className="ov-hero-sub">
          {data.totals.files === 0
            ? "Nothing registered yet"
            : `across ${plural(typesInUse, "file type")}`}
        </span>
      </div>
      <div className="ov-hero-spark">
        <Spark series={data.byYear.map((y) => y.count)} />
        <span className="ov-hero-range">
          {data.byYear[0]?.year} – {data.byYear[data.byYear.length - 1]?.year}
        </span>
      </div>
    </section>
  );
}

function Tile(props: {
  label: string;
  value: ReactNode;
  foot?: ReactNode;
  attention?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="ov-tile-label">{props.label}</span>
      <span className="ov-tile-value">{props.value}</span>
      {props.foot && <span className="ov-tile-foot">{props.foot}</span>}
    </>
  );
  const cls = `ov-tile${props.attention ? " is-attention" : ""}`;
  return props.onClick ? (
    <button type="button" className={`${cls} is-link`} onClick={props.onClick}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function RecentList({
  files,
  showAdvocate,
  onOpen,
}: {
  files: RecentFile[];
  showAdvocate: boolean;
  onOpen: (f: RecentFile) => void;
}) {
  if (files.length === 0) {
    return <p className="ov-muted">No files to show yet.</p>;
  }
  return (
    <ul className="ov-recent" role="list">
      {files.map((f) => {
        const meta = typeMeta(f.fileType);
        const sep = f.fileType === "consultancy" ? " · " : " vs ";
        const parties = [f.partyOne, f.partyTwo].filter(Boolean).join(sep);
        return (
          <li key={`${f.fileType}-${f.id}`}>
            <button type="button" onClick={() => onOpen(f)}>
              <span className="ov-code">{meta.tag}</span>
              <span className="ov-recent-main">
                <span className="ov-recent-ref">{reference(f)}</span>
                <span className="ov-recent-parties">
                  {parties || "No parties recorded"}
                </span>
              </span>
              <span className="ov-recent-meta">
                {f.year ?? "—"}
                {showAdvocate && f.createdBy ? ` · ${f.createdBy}` : ""}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Page ---------- */

export default function Overview({ onNewFile, onBrowseFiles }: OverviewProps) {
  const navigate = useNavigate();
  const { mark, node: tipNode } = useTip();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [name, setName] = useState<string>("");
  const [scope, setScope] = useState<Scope>("firm");
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0); // bump to refetch

  // Who is looking? Decides which endpoint to call.
  useEffect(() => {
    let cancelled = false;
    authClient.getSession().then(({ data: session }) => {
      if (cancelled) return;
      setIsAdmin(isAdminRole(session?.user?.role));
      setName((session?.user?.name ?? "").split(" ")[0] ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const endpoint =
    isAdmin === null
      ? null
      : isAdmin && scope === "firm"
        ? "/api/dashboard/admin"
        : "/api/dashboard/user";

  const load = useCallback(async (path: string): Promise<Dashboard> => {
    const { data: session } = await authClient.getSession();
    const token = session?.session?.token;
    if (!token) throw new Error("You are signed out. Please sign in again.");

    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to load the overview.");
    }
    return res.json();
  }, []);

  useEffect(() => {
    if (!endpoint) return;
    let cancelled = false;
    setLoading(true);
    load(endpoint)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Something went wrong.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, load, tick]);

  const openFile = (f: RecentFile) =>
    navigate(`/case-files/${f.fileType}/${f.id}`);

  /* ----- first load / error ----- */
  if (!data) {
    return (
      <div className="ov-root">
        {error ? (
          <div className="ov-card ov-error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setTick((t) => t + 1)}
            >
              Try again
            </button>
          </div>
        ) : (
          <p className="ov-muted" role="status">
            Loading overview…
          </p>
        )}
      </div>
    );
  }

  const firm = data.scope === "admin";
  const { totals } = data;
  const topType = data.byType[0];
  const latest = data.recent[0];

  /* ----- nothing registered ----- */
  const empty = totals.files === 0;

  return (
    <div className="ov-root">
      {tipNode}

      <div className="ov-toolbar">
        <div className="ov-welcome">
          <span className="ov-welcome-line">
            {greeting()}
            {name ? `, ${name}` : ""}.
          </span>
          <span className="ov-muted">
            {firm
              ? "Here is where every file in the firm stands."
              : "Here is where your files stand."}
          </span>
        </div>

        <div className="ov-toolbar-actions">
          {isAdmin && (
            <div className="ov-seg" role="group" aria-label="Whose files">
              <button
                type="button"
                aria-pressed={scope === "firm"}
                onClick={() => setScope("firm")}
              >
                Whole firm
              </button>
              <button
                type="button"
                aria-pressed={scope === "mine"}
                onClick={() => setScope("mine")}
              >
                My files
              </button>
            </div>
          )}
          <button
            type="button"
            className="btn-secondary ov-refresh"
            onClick={() => setTick((t) => t + 1)}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="ov-banner" role="alert">
          {error}
        </div>
      )}

      {/* Keep the frame while refetching: dim, never blank. */}
      <div className={`ov-frame${loading ? " is-loading" : ""}`}>
        {empty ? (
          <section className="ov-card ov-empty">
            <h3>{firm ? "No files on record yet" : "You have no files yet"}</h3>
            <p>
              {firm
                ? "As soon as an advocate opens a file, the firm overview will fill in."
                : "Open your first file and your overview will start to fill in."}
            </p>
            <div className="ov-empty-actions">
              {onNewFile && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onNewFile}
                >
                  Open a new file
                </button>
              )}
            </div>
          </section>
        ) : (
          <>
            <div className="ov-top">
              <Hero
                data={data}
                title={firm ? "Files on record" : "Your files"}
              />

              <div className="ov-tiles">
                <Tile
                  label={`Dated ${totals.currentYear}`}
                  value={fmt(totals.thisYear)}
                  foot={deltaText(
                    totals.thisYear,
                    totals.lastYear,
                    totals.currentYear - 1,
                  )}
                />

                {firm ? (
                  <>
                    <Tile
                      label="Advocates with files"
                      value={
                        <>
                          {fmt(data.team?.advocatesWithFiles ?? 0)}
                          <small>
                            {" "}
                            of {fmt(data.team?.registeredUsers ?? 0)}
                          </small>
                        </>
                      }
                      foot="registered users"
                    />
                    <Tile
                      label="Unassigned files"
                      value={fmt(data.unassigned ?? 0)}
                      attention={(data.unassigned ?? 0) > 0}
                      foot={
                        (data.unassigned ?? 0) > 0 ? (
                          <span className="ov-flag">
                            <b aria-hidden="true">!</b> Needs an advocate
                          </span>
                        ) : (
                          "Every file has an advocate"
                        )
                      }
                    />
                  </>
                ) : (
                  <>
                    <Tile
                      label="Most files in"
                      value={topType ? typeMeta(topType.fileType).label : "—"}
                      foot={topType ? plural(topType.count, "file") : undefined}
                    />
                    <Tile
                      label="Latest file"
                      value={latest ? reference(latest) : "—"}
                      foot={
                        latest ? typeMeta(latest.fileType).label : undefined
                      }
                      onClick={latest ? () => openFile(latest) : undefined}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="ov-grid">
              <ChartCard
                className="ov-span-6"
                title="Files by type"
                sub={firm ? "Every file in the firm" : "Your files"}
                table={{
                  head: ["Type", "Files"],
                  rows: data.byType.map((t) => [
                    typeMeta(t.fileType).label,
                    t.count,
                  ]),
                }}
              >
                <RankedBars
                  unit="file"
                  mark={mark}
                  rows={data.byType.map((t) => {
                    const meta = typeMeta(t.fileType);
                    return {
                      key: t.fileType,
                      tag: meta.tag,
                      label: meta.label,
                      count: t.count,
                      note:
                        totals.files > 0
                          ? `${Math.round((t.count / totals.files) * 100)}% of ${firm ? "all files" : "your files"}`
                          : undefined,
                    };
                  })}
                />
              </ChartCard>

              <ChartCard
                className="ov-span-6"
                title="Files by year"
                sub="By hearing or received date"
                table={{
                  head: ["Year", "Files"],
                  rows: [
                    ...data.byYear.map((y) => [y.year, y.count]),
                    ...(data.earlier > 0 ? [["Earlier", data.earlier]] : []),
                    ...(totals.undated > 0
                      ? [["No date", totals.undated]]
                      : []),
                  ],
                }}
              >
                <YearColumns
                  years={data.byYear}
                  currentYear={totals.currentYear}
                  mark={mark}
                />
                {(data.earlier > 0 || totals.undated > 0) && (
                  <p className="ov-footnote">
                    {data.earlier > 0 &&
                      `${plural(data.earlier, "older file")}`}
                    {data.earlier > 0 && totals.undated > 0 && " · "}
                    {totals.undated > 0 &&
                      `${plural(totals.undated, "file")} without a date`}{" "}
                    not shown.
                  </p>
                )}
              </ChartCard>

              {firm && data.byAdvocate && (
                <ChartCard
                  className="ov-span-6"
                  title="Advocate workload"
                  sub="Files per advocate"
                  table={{
                    head: ["Advocate", "Files", `Dated ${totals.currentYear}`],
                    rows: data.byAdvocate.map((a) => [
                      a.name,
                      a.files,
                      a.thisYear,
                    ]),
                  }}
                >
                  {data.byAdvocate.length === 0 ? (
                    <p className="ov-muted">
                      No files are assigned to anyone yet.
                    </p>
                  ) : (
                    <RankedBars
                      unit="file"
                      mark={mark}
                      rows={data.byAdvocate.map((a) => ({
                        key: a.advocateId,
                        tag: a.initials ?? "??",
                        label: a.name,
                        count: a.files,
                        note: `${plural(a.thisYear, "file")} dated ${totals.currentYear}`,
                      }))}
                    />
                  )}
                  {data.otherAdvocates && data.otherAdvocates.advocates > 0 && (
                    <p className="ov-footnote">
                      +{" "}
                      {plural(data.otherAdvocates.advocates, "other advocate")}{" "}
                      with {plural(data.otherAdvocates.files, "file")}.
                    </p>
                  )}
                </ChartCard>
              )}

              <section
                className={`ov-card ${firm ? "ov-span-6" : "ov-span-12"}`}
              >
                <header className="ov-card-head">
                  <div>
                    <h3>Recently registered</h3>
                    <p>Newest files first</p>
                  </div>
                  {onBrowseFiles && (
                    <button
                      type="button"
                      className="ov-link"
                      onClick={onBrowseFiles}
                    >
                      Browse all files →
                    </button>
                  )}
                </header>
                <RecentList
                  files={data.recent}
                  showAdvocate={firm}
                  onOpen={openFile}
                />
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
