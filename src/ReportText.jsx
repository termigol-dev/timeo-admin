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

export default function ReportText({ week }) {

    function renderTextDetailed() {

        const weekHasContent = Array.from(week.daysMap.values()).some(day =>
            (day?.shifts?.length || 0) > 0 ||
            (day?.records?.length || 0) > 0
        );

        if (!weekHasContent) {
            return (
                <div className="report-week">

                    <div className="report-week-header">
                        Semana desde {toISODate(week.weekStart)}
                    </div>

                    <div className="report-empty">
                        Sin horario previsto ni fichajes en esta semana
                    </div>

                </div>
            );
        }

        return (
            <div className="report-week">

                <div className="report-week-header">
                    Semana desde {toISODate(week.weekStart)}
                </div>

                {Array.from({ length: 7 }).map((_, idx) => {

                    const d = addDays(week.weekStart, idx);
                    const dateStr = toISODate(d);

                    const dayData = week.daysMap.get(dateStr);
                    if (!dayData) return null;

                    const dayLabel = weekdayName(dateStr);

                    const shifts = dayData?.shifts ?? [];
                    const records = [...(dayData?.records ?? [])]
                        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                    const incidents = dayData?.incidents ?? [];

                    // construir pares IN → OUT
                    const pairs = [];
                    const used = new Set();

                    for (let i = 0; i < records.length; i++) {

                        if (records[i].type === "IN") {

                            const next = records[i + 1];

                            if (next && next.type === "OUT") {

                                pairs.push({
                                    in: records[i],
                                    out: next
                                });

                                used.add(records[i].id);
                                used.add(next.id);

                                i++;

                            } else {

                                pairs.push({
                                    in: records[i],
                                    out: null
                                });

                                used.add(records[i].id);

                            }

                        }

                    }

                    records.forEach(r => {

                        if (r.type === "OUT" && !used.has(r.id)) {

                            pairs.push({
                                in: null,
                                out: r
                            });

                        }

                    });

                    let pairIndex = 0;

                    return (
                        <div key={dateStr} className="report-day">

                            <div className="report-day-title">
                                {dayLabel} — {dateStr}
                            </div>

                            {shifts.length === 0 && (
                                <div className="report-empty">— Sin horario</div>
                            )}

                            {shifts.map(shift => {

                                const [h1, m1] = shift.startTime.split(":").map(Number);
                                const [h2, m2] = shift.endTime.split(":").map(Number);

                                const start = h1 * 60 + m1;
                                const end = h2 * 60 + m2;

                                let inRecord = null;
                                let outRecord = null;

                                pairs.forEach(p => {

                                    if (p.in) {

                                        const dt = new Date(p.in.createdAt);
                                        const t = dt.getHours() * 60 + dt.getMinutes();

                                        if (t >= start - 120 && t <= end) {
                                            inRecord = p.in;
                                        }

                                    }

                                    if (p.out) {

                                        const dt = new Date(p.out.createdAt);
                                        const t = dt.getHours() * 60 + dt.getMinutes();

                                        if (t >= start && t <= end + 120) {
                                            outRecord = p.out;
                                        }

                                    }

                                });
                                if (!pair) {

                                    return (
                                        <div key={shift.startTime} className="report-row">

                                            <div className="report-shift">
                                                {shift.startTime} → {shift.endTime}
                                            </div>

                                            <div className="report-in">
                                                {renderRecord(pair.in)}
                                            </div>

                                            <div className="report-out">
                                                {renderRecord(pair.out)}
                                            </div>

                                        </div>
                                    );

                                }

                                function renderRecord(r) {

                                    if (!r) return null;

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
                                        <div className="report-record">

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
                                }

                                return (
                                    <div key={shift.startTime} className="report-row">

                                        <div className="report-shift">
                                            {shift.startTime} → {shift.endTime}
                                        </div>

                                        {renderRecord(inRecord)}
                                        {renderRecord(outRecord)}

                                    </div>
                                );

                            })}

                        </div>
                    );

                })}

            </div>
        );
    }

    return (
        <div className="report-text-container">
            {renderTextDetailed()}
        </div>
    );
}