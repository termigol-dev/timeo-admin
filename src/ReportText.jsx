import React from "react";

function weekdayName(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("es-ES", { weekday: "long" });
}

function toISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

export default function ReportText({ week, reportMode }) {

    function renderTextSimplified() {

        return (
            <div className="report-week">

                <div className="report-week-header">
                    Semana desde {toISODate(week.weekStart)}
                </div>

                {Array.from({ length: 7 }).map((_, idx) => {

                    const d = addDays(week.weekStart, idx);
                    const dateStr = toISODate(d);
                    const dayData = week.daysMap.get(dateStr);

                    const dayLabel = weekdayName(dateStr);
                    const records = dayData?.records ?? [];

                    if (records.length === 0) return null;

                    return (
                        <div key={`${dateStr}-${idx}`} className="report-day">

                            <div className="report-day-title">
                                {dayLabel} — {dateStr}
                            </div>

                            <div className="report-records">

                                {records
                                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                    .map(r => {

                                        const dt = new Date(r.createdAt);
                                        const hh = String(dt.getHours()).padStart(2, "0");
                                        const mm = String(dt.getMinutes()).padStart(2, "0");

                                        return (
                                            <div key={r.id} className="report-record">

                                                <div
                                                    className={
                                                        r.type === "IN"
                                                            ? "report-badge-in"
                                                            : "report-badge-out"
                                                    }
                                                >
                                                    {r.type}
                                                </div>

                                                <div className="report-time">
                                                    {hh}:{mm}
                                                </div>

                                            </div>
                                        );

                                    })}

                            </div>

                        </div>
                    );
                })}

            </div>
        );
    }

    function renderTextDetailed() {

        return (
            <div className="report-week">

                <div className="report-week-header">
                    Semana desde {toISODate(week.weekStart)}
                </div>

                {Array.from({ length: 7 }).map((_, idx) => {

                    const d = addDays(week.weekStart, idx);
                    const dateStr = toISODate(d);
                    const dayData = week.daysMap.get(dateStr);

                    const dayLabel = weekdayName(dateStr);

                    const shifts = dayData?.shifts ?? [];
                    const records = dayData?.records ?? [];
                    const incidents = dayData?.incidents ?? [];

                    return (
                        <div key={`${dateStr}-${idx}`} className="report-day">

                            <div className="report-day-title">
                                {dayLabel} — {dateStr}
                            </div>

                            {/* SHIFTS */}
                            <div className="report-shifts">

                                <div className="report-section-title">
                                    Horario previsto
                                </div>

                                {shifts.length === 0 && (
                                    <div className="report-empty">— Ninguno</div>
                                )}

                                {shifts.map(s => (
                                    <div key={s.id || `${s.startTime}-${s.endTime}`}>
                                        {s.startTime} → {s.endTime}
                                    </div>
                                ))}

                            </div>

                            {/* REGISTROS */}
                            <div className="report-records">

                                <div className="report-section-title">
                                    Registros
                                </div>

                                {records.map(r => {

                                    const dt = new Date(r.createdAt);
                                    const hh = String(dt.getHours()).padStart(2, "0");
                                    const mm = String(dt.getMinutes()).padStart(2, "0");

                                    const timeMin = dt.getHours() * 60 + dt.getMinutes();

                                    const relatedIncidents = incidents.filter(i => {

                                        const it = new Date(i.occurredAt || i.createdAt);
                                        const imin = it.getHours() * 60 + it.getMinutes();

                                        return Math.abs(imin - timeMin) <= 5;

                                    });

                                    return (
                                        <div key={r.id} className="report-record">

                                            <div
                                                className={
                                                    r.type === "IN"
                                                        ? "report-badge-in"
                                                        : "report-badge-out"
                                                }
                                            >
                                                {r.type}
                                            </div>

                                            <div className="report-time">
                                                {hh}:{mm}
                                            </div>

                                            {relatedIncidents.map(i => {

                                                let color = "incident-yellow";

                                                if (i.type === "NO_SHOW") color = "incident-red";
                                                else if (
                                                    i.type === "IN_LATE" ||
                                                    i.type === "OUT_EARLY"
                                                ) color = "incident-orange";

                                                return (
                                                    <div
                                                        key={i.id}
                                                        className={`incident-dot ${color}`}
                                                        title={i.type}
                                                    />
                                                );

                                            })}

                                        </div>
                                    );

                                })}

                            </div>

                            {/* INCIDENTES */}
                            {incidents.length > 0 && (

                                <div className="report-incidents">

                                    <div className="report-section-title">
                                        Incidencias
                                    </div>

                                    {incidents.map(i => {

                                        const dt = new Date(i.occurredAt || i.createdAt);
                                        const hh = String(dt.getHours()).padStart(2, "0");
                                        const mm = String(dt.getMinutes()).padStart(2, "0");

                                        let color = "incident-yellow";

                                        if (i.type === "NO_SHOW") color = "incident-red";
                                        else if (
                                            i.type === "IN_LATE" ||
                                            i.type === "OUT_EARLY"
                                        ) color = "incident-orange";

                                        return (
                                            <div key={i.id} className="report-incident">

                                                <div className={`incident-dot ${color}`} />

                                                <div>
                                                    {i.type} — {hh}:{mm}
                                                </div>

                                            </div>
                                        );

                                    })}

                                </div>

                            )}

                        </div>
                    );
                })}

            </div>
        );
    }

    return (
        <div className="report-text-container">

            {reportMode === "simplified"
                ? renderTextSimplified()
                : renderTextDetailed()}

        </div>
    );
}