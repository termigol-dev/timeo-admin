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

                    const shiftRows = shifts.map(s => ({
                        shift: s,
                        ins: [],
                        outs: []
                    }));

                    records.forEach(r => {

                        const dt = new Date(r.createdAt);
                        const t = dt.getHours() * 60 + dt.getMinutes();

                        let closestIndex = 0;
                        let closestDistance = Infinity;

                        shifts.forEach((s, i) => {

                            const [h1, m1] = s.startTime.split(":").map(Number);
                            const [h2, m2] = s.endTime.split(":").map(Number);

                            const target = r.type === "IN"
                                ? (h1 * 60 + m1)
                                : (h2 * 60 + m2);

                            const dist = Math.abs(t - target);

                            if (dist < closestDistance) {
                                closestDistance = dist;
                                closestIndex = i;
                            }

                        });

                        if (r.type === "IN") {

                            const slot = shiftRows[closestIndex].ins.length;
                            if (slot < 3) shiftRows[closestIndex].ins[slot] = r;

                        } else {

                            const slot = shiftRows[closestIndex].outs.length;
                            if (slot < 3) shiftRows[closestIndex].outs[slot] = r;

                        }

                    });

                    return (
                        <div key={dateStr} className="report-day">

                            <div className="report-day-title">
                                {dayLabel} — {dateStr}
                            </div>

                            {shifts.length === 0 && (
                                <div className="report-empty">— Sin horario</div>
                            )}

                            {shiftRows.map(row => {

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

                                // obtener todos los fichajes de este turno
                                const shiftRecords = [
                                    ...row.ins.filter(Boolean),
                                    ...row.outs.filter(Boolean)
                                ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                                const extraRecords = shiftRecords.slice(6);

                                return (

                                    <React.Fragment key={row.shift.startTime}>

                                        <div className="report-row">

                                            <div className="report-shift">
                                                {row.shift.startTime} → {row.shift.endTime}
                                            </div>

                                            <div className="report-cell">{renderRecord(row.ins?.[0])}</div>
                                            <div className="report-cell">{renderRecord(row.outs?.[0])}</div>

                                            <div className="report-cell">{renderRecord(row.ins?.[1])}</div>
                                            <div className="report-cell">{renderRecord(row.outs?.[1])}</div>

                                            <div className="report-cell">{renderRecord(row.ins?.[2])}</div>
                                            <div className="report-cell">{renderRecord(row.outs?.[2])}</div>

                                        </div>

                                        {extraRecords.length > 0 && (() => {

                                            const first = new Date(extraRecords[0].createdAt);
                                            const last = new Date(extraRecords[extraRecords.length - 1].createdAt);

                                            const fh = String(first.getHours()).padStart(2, "0");
                                            const fm = String(first.getMinutes()).padStart(2, "0");

                                            const lh = String(last.getHours()).padStart(2, "0");
                                            const lm = String(last.getMinutes()).padStart(2, "0");

                                            return (

                                                <div className="report-row">

                                                    <div className="report-shift"></div>

                                                    <div className="report-warning">
                                                        {extraRecords.length} fichajes más entre {fh}:{fm} y {lh}:{lm}
                                                    </div>

                                                </div>

                                            );

                                        })()}

                                    </React.Fragment>

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