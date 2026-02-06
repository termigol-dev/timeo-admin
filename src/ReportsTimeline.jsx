import React from 'react';

/*
  days = lo que ya te devuelve el backend:
  [
    {
      date,
      shifts,
      records,
      incidents
    }
  ]
*/

export default function ReportsTimeline({ days }) {

  function minutesToPercent(date) {
    const d = new Date(date);
    const minutes = d.getHours() * 60 + d.getMinutes();
    return (minutes / 1440) * 100;
  }

  function timeToPercent(time) {
    const [h, m] = time.split(':').map(Number);
    const minutes = h * 60 + m;
    return (minutes / 1440) * 100;
  }

  function incidentColor(type) {
    switch (type) {
      case 'IN_EARLY':
      case 'OUT_LATE':
      case 'FORGOT_IN':
      case 'FORGOT_OUT':
        return '#facc15'; // amarillo

      case 'IN_LATE':
      case 'OUT_EARLY':
        return '#fb923c'; // naranja

      case 'NO_SHOW':
        return '#ef4444'; // rojo

      case 'DAY_OFF':
      case 'VACATION':
        return '#fb923c';

      default:
        return '#9ca3af';
    }
  }

  return (
    <div style={{ padding: 16 }}>

      {/* escala */}
      <div style={{ position: 'relative', height: 24, marginLeft: 90 }}>
        {[0,4,8,12,16,20,24].map(h => (
          <div
            key={h}
            style={{
              position: 'absolute',
              left: `${(h * 60 / 1440) * 100}%`,
              fontSize: 12,
              transform: 'translateX(-50%)'
            }}
          >
            {String(h).padStart(2,'0')}:00
          </div>
        ))}
      </div>

      {days.map(day => {

        // bloques verdes (trabajado)
        const worked = [];
        for (let i = 0; i < day.records.length - 1; i++) {
          const a = day.records[i];
          const b = day.records[i + 1];

          if (a.type !== 'IN' || b.type !== 'OUT') continue;

          worked.push({
            id: a.id,
            from: a.createdAt,
            to: b.createdAt,
          });
        }

        return (
          <div
            key={day.date}
            style={{
              display: 'flex',
              marginBottom: 18,
              alignItems: 'center'
            }}
          >

            {/* fecha */}
            <div style={{ width: 80, fontSize: 12 }}>
              {day.date}
            </div>

            <div style={{ flex: 1 }}>

              {/* incidencias */}
              <div
                style={{
                  position: 'relative',
                  height: 8,
                  marginBottom: 2,
                  background: '#f3f4f6'
                }}
              >
                {day.incidents.map(i => (
                  <div
                    key={i.id}
                    style={{
                      position: 'absolute',
                      left: `${minutesToPercent(i.occurredAt)}%`,
                      width: 5,
                      height: '100%',
                      background: incidentColor(i.type),
                      borderRadius: 2
                    }}
                  />
                ))}
              </div>

              {/* trabajado */}
              <div
                style={{
                  position: 'relative',
                  height: 10,
                  marginBottom: 2,
                  background: '#f3f4f6'
                }}
              >
                {worked.map(w => {
                  const l = minutesToPercent(w.from);
                  const r = minutesToPercent(w.to);
                  return (
                    <div
                      key={w.id}
                      style={{
                        position: 'absolute',
                        left: `${l}%`,
                        width: `${r - l}%`,
                        height: '100%',
                        background: '#22c55e',
                        borderRadius: 3
                      }}
                    />
                  );
                })}
              </div>

              {/* horario */}
              <div
                style={{
                  position: 'relative',
                  height: 10,
                  background: '#f3f4f6'
                }}
              >
                {day.shifts.map(s => {
                  const l = timeToPercent(s.startTime);
                  const r = timeToPercent(s.endTime);
                  return (
                    <div
                      key={s.id}
                      style={{
                        position: 'absolute',
                        left: `${l}%`,
                        width: `${r - l}%`,
                        height: '100%',
                        background: '#3b82f6',
                        borderRadius: 3
                      }}
                    />
                  );
                })}
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}