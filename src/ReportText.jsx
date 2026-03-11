import React from "react";

function weekdayName(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-ES', { weekday: 'long' });
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
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
<div className="week-block">

  <div
    style={{
      border: '1px solid #ddd',
      borderRadius: 8,
      padding: 12,
      marginBottom: 24,
      background: '#fff'
    }}
  >

    <div style={{ fontWeight: 600, marginBottom: 12 }}>
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
        <div key={`${dateStr}-${idx}`} style={{ marginBottom: 16 }}>

          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {dayLabel} — {dateStr}
          </div>

          {records
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map(r => {

              const dt = new Date(r.createdAt);
              const hh = String(dt.getHours()).padStart(2, '0');
              const mm = String(dt.getMinutes()).padStart(2, '0');

              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginTop: 4,
                    fontSize: 14
                  }}
                >
                  <div
                    style={{
                      minWidth: 60,
                      textAlign: 'center',
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: r.type === 'IN' ? '#16a34a' : '#dc2626',
                      color: '#fff',
                      fontWeight: 600
                    }}
                  >
                    {r.type}
                  </div>

                  <div>{hh}:{mm}</div>

                </div>
              );

            })}
        </div>
      );
    })}
  </div>

</div>
);

}

function renderTextDetailed() {

return (
<div className="week-block">

  <div
    style={{
      border: '1px solid #ddd',
      borderRadius: 8,
      padding: 12,
      marginBottom: 24,
      background: '#fff'
    }}
  >

    <div style={{ fontWeight: 600, marginBottom: 12 }}>
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
        <div key={`${dateStr}-${idx}`} style={{ marginBottom: 20 }}>

          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {dayLabel} — {dateStr}
          </div>

          <div style={{ marginTop: 6 }}>
            <b>🟦 Shifts previstos</b>

            {shifts.length === 0 && <div>— Ninguno</div>}

            {shifts.map(s => (
              <div key={s.id || `${s.startTime}-${s.endTime}`}>
                {s.startTime} → {s.endTime}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10 }}>
            <b>📜 Línea temporal</b>

            {records.map(r => {

              const dt = new Date(r.createdAt);
              const hh = String(dt.getHours()).padStart(2, '0');
              const mm = String(dt.getMinutes()).padStart(2, '0');

              return (
                <div key={r.id}>
                  {r.type} — {hh}:{mm}
                </div>
              );
            })}

            {incidents.map(i => {

              const dt = new Date(i.occurredAt || i.createdAt);
              const hh = String(dt.getHours()).padStart(2, '0');
              const mm = String(dt.getMinutes()).padStart(2, '0');

              return (
                <div key={i.id}>
                  ⚠ {i.type} — {hh}:{mm}
                </div>
              );
            })}
          </div>

        </div>
      );
    })}
  </div>

</div>
);

}

return (
<div className="text-report-grid">
  {reportMode === "simplified"
    ? renderTextSimplified()
    : renderTextDetailed()}
</div>
);

}