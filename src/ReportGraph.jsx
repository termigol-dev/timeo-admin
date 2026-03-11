import React, { useState } from "react";

function timeToMinutes(t) {
const [h, m] = t.split(':').map(Number);
return h * 60 + m;
}

function minutesToPercent(min) {
return (min / 1440) * 100;
}

function toISODate(d) {
const y = d.getFullYear();
const m = String(d.getMonth() + 1).padStart(2, '0');
const day = String(d.getDate()).padStart(2, '0');
return `${y}-${m}-${day}`;
}

function weekdayName(dateStr) {
const [y, m, d] = dateStr.split('-').map(Number);
const date = new Date(y, m - 1, d);
return date.toLocaleDateString('es-ES', { weekday: 'long' });
}

function hourLabel(h) {
if (h === 0) return '12 AM';
if (h < 12) return `${h} AM`;
if (h === 12) return '12 PM';
return `${h - 12} PM`;
}

function addDays(d, n) {
const x = new Date(d);
x.setDate(x.getDate() + n);
return x;
}

function incidentLabel(type) {
switch (type) {
case "IN_EARLY": return "IE";
case "OUT_LATE": return "OL";
case "IN_LATE": return "IL";
case "OUT_EARLY": return "OE";
case "NO_SHOW": return "NS";
case "FORGOT_IN": return "FI";
case "FORGOT_OUT": return "FO";
default: return "";
}
}

export default function ReportGraph({ week, reportMode, month }) {

const [hoverMinute, setHoverMinute] = useState(null);
const [hoverColor, setHoverColor] = useState("#111");

return (

<div
style={{
border: '1px solid #ddd',
borderRadius: 8,
padding: 12,
marginBottom: 24,
}}
>

<div style={{ fontWeight: 600, marginBottom: 12 }}>
Semana desde {toISODate(week.weekStart)}
</div>

{Array.from({ length: 7 }).map((_, idx) => {

const d = addDays(week.weekStart, idx);
const dateStr = toISODate(d);

const dayData = week.daysMap.get(dateStr);

const isSameMonth = d.getMonth() === month;

const dayLabel = weekdayName(dateStr);

const shifts = dayData?.shifts || [];
const records = dayData?.records || [];
const incidents = dayData?.incidents || [];

if (reportMode === 'simplified' && records.length === 0) {
return null;
}

return (
<div
key={`${dateStr}-${idx}`}
style={{
marginBottom: 18,
opacity: isSameMonth ? 1 : 0.35,
}}
>

<div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
<div style={{ fontSize: 20, fontWeight: 700 }}>
{dayLabel}
</div>
<div style={{ fontSize: 13, color: '#555' }}>
{dateStr}
</div>
</div>

<div
style={{
position: 'relative',
height: 80,
marginTop: 6,
borderTop: '1px solid #bbb',
borderBottom: '1px solid #bbb',
background: '#fff',
}}
>

{/* línea vertical hover */}
{hoverMinute !== null && (
<div
style={{
position: "absolute",
left: `${minutesToPercent(hoverMinute)}%`,
top: 0,
bottom: 0,
width: 3,
background: hoverColor,
opacity: 0.9,
pointerEvents: "none"
}}
/>
)}

{/* grid de horas */}
{Array.from({ length: 25 }).map((_, h) => {

const isMain = h % 4 === 0;

return (
<div
key={h}
style={{
position: 'absolute',
left: `${(h / 24) * 100}%`,
bottom: 0,
height: '100%',
width: 1,
background: '#000',
opacity: isMain ? 0.35 : 0.12,
}}
>
{isMain && h < 24 && (
<div
style={{
position: 'absolute',
bottom: 0,
left: 2,
transform: 'rotate(-90deg)',
transformOrigin: 'left bottom',
fontSize: 9,
whiteSpace: 'nowrap',
color: '#000',
}}
>
{hourLabel(h)}
</div>
)}
</div>
);
})}

{/* horario previsto */}
{reportMode === 'detailed' && shifts.map(s => {

const start = timeToMinutes(s.startTime);
const end = timeToMinutes(s.endTime);

return (
<div
key={`${s.startTime}_${s.endTime}`}
style={{
position: 'absolute',
bottom: 24,
height: 10,
left: `${minutesToPercent(start)}%`,
width: `${minutesToPercent(end - start)}%`,
background: '#2563eb',
borderRadius: 3,
}}
/>
);
})}

{/* bloques trabajados */}
{(() => {

const ordered = [...records].sort(
(a, b) => new Date(a.createdAt) - new Date(b.createdAt)
);

const blocks = [];

for (let i = 0; i < ordered.length - 1; i++) {

const a = ordered[i];
const b = ordered[i + 1];

if (a.type !== 'IN' || b.type !== 'OUT') continue;

const sa = new Date(a.createdAt);
const sb = new Date(b.createdAt);

const startMin = sa.getHours() * 60 + sa.getMinutes();
const endMin = sb.getHours() * 60 + sb.getMinutes();

blocks.push(
<div
key={a.id}
style={{
position: 'absolute',
bottom: 10,
height: 10,
left: `${minutesToPercent(startMin)}%`,
width: `${minutesToPercent(endMin - startMin)}%`,
background: '#22c55e',
borderRadius: 3,
}}
/>
);
}

return blocks;
})()}

{/* incidencias */}
{reportMode === 'detailed' && (() => {

const sorted = [...incidents].sort(
(a, b) => new Date(a.createdAt) - new Date(b.createdAt)
);

let lastMinute = null;
let layer = 0;

return sorted.map(i => {

const dateStr = i.occurredAt || i.createdAt;
const dt = new Date(dateStr);

const min = dt.getHours() * 60 + dt.getMinutes();
const timePart = dateStr.slice(11, 16);

const STACK_WINDOW = 25;
const MAX_LAYERS = 3;

if (lastMinute !== null && Math.abs(min - lastMinute) <= STACK_WINDOW) {
layer = (layer + 1) % MAX_LAYERS;
} else {
layer = 0;
}

lastMinute = min;

let color = '#eab308';

if (i.type === 'NO_SHOW') color = '#dc2626';
else if (i.type === 'IN_LATE' || i.type === 'OUT_EARLY') color = '#f97316';

return (
<div
key={i.id}
title={`${i.type} ${timePart}`}
onMouseEnter={() => {
setHoverMinute(min);
setHoverColor(color);
}}
onMouseLeave={() => setHoverMinute(null)}
style={{
position: 'absolute',
left: `${minutesToPercent(min)}%`,
bottom: 36 + layer * 12,
transform: 'translateX(-50%)',
display: 'flex',
justifyContent: 'center',
alignItems: 'center',
width: 18,
height: 18,
borderRadius: '50%',
background: color,
fontSize: 9,
fontWeight: 700,
color: '#000',
cursor: 'pointer'
}}
>
{incidentLabel(i.type)}
</div>
);

});

})()}

</div>
</div>
);
})}
</div>
);
}