// src/components/profile/UpgradeModal.jsx
import React from 'react';

export default function UpgradeModal({
  open,
  onClose,
  title = 'Actualizar plan',
  description = '',
  confirmText = 'Continuar',
  onConfirm,
}) {

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'white',
          borderRadius: 28,
          padding: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >

        {/* ICON */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#dbeafe',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
            marginBottom: 24,
          }}
        >
          💎
        </div>

        {/* TITLE */}
        <h2
          style={{
            marginTop: 0,
            marginBottom: 14,
            fontSize: 30,
            color: '#0f172a',
          }}
        >
          {title}
        </h2>

        {/* DESCRIPTION */}
        <p
          style={{
            marginTop: 0,
            marginBottom: 34,
            color: '#64748b',
            lineHeight: 1.7,
            fontSize: 16,
          }}
        >
          {description}
        </p>

        {/* ACTIONS */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >

          <button
            onClick={onClose}
            style={{
              border: '1px solid #dbe2ea',
              background: 'white',
              color: '#0f172a',
              borderRadius: 999,
              padding: '14px 20px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            style={{
              border: 'none',
              background: '#2563eb',
              color: 'white',
              borderRadius: 999,
              padding: '14px 20px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {confirmText}
          </button>

        </div>

      </div>
    </div>
  );
}