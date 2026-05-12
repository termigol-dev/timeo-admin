// src/components/profile/TeamUsageCard.jsx
import { useNavigate } from 'react-router-dom';
import React from 'react';

export default function TeamUsageCard({
  companyId,
  employees = [],
  employeesUsed = 0,
  employeesLimit = 0,
  extraEmployees = 0,
}) {

  const placeholders =
    employeesLimit - employeesUsed > 0
      ? employeesLimit - employeesUsed
      : 0;
  const navigate = useNavigate();
  const showExtraMessage =
    employeesUsed >= employeesLimit;

  const getInitials = employee => {

    const first =
      employee?.name?.[0] || '';

    const second =
      employee?.firstSurname?.[0] || '';

    return `${first}${second}`.toUpperCase();
  };

  return (

    <div
      style={{
        background: 'white',
        borderRadius: 24,
        padding: 28,
        boxShadow: '0 4px 20px rgba(15,23,42,0.04)',
      }}
    >

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
          marginBottom: 26,
        }}
      >

        <div>

          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: '#94a3b8',
              marginBottom: 10,
              letterSpacing: 1,
            }}
          >
            EQUIPO
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 600,
              color: '#0f172a',
            }}
          >
            {employeesUsed} / {employeesLimit} empleados
          </h2>

          {extraEmployees > 0 && (
            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                fontSize: 14,
                color: '#06b6d4',
                fontWeight: 600,
              }}
            >
              +{extraEmployees} empleados extra activos
            </p>
          )}

        </div>

        {/* BUTTON */}
        <button
          type="button"
          className="pillButton"
          onClick={() => navigate(`/admin/companies/${companyId}/employees/new`)
        }
        >
          {showExtraMessage
            ? 'Añadir empleado extra'
            : 'Añadir empleado'}
        </button>

      </div>

      {/* EMPLOYEES */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >

        {/* REALES */}
        {employees.map(employee => (

          employee.photoUrl ? (

            <img
              key={employee.id}
              src={employee.photoUrl}
              alt=""
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid white',
                boxShadow:
                  '0 4px 12px rgba(15,23,42,0.08)',
              }}
            />

          ) : (

            <div
              key={employee.id}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',

                background:
                  'linear-gradient(135deg, #99f6e4 0%, #67e8f9 100%)',

                color: '#0f172a',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                fontSize: 15,
                fontWeight: 600,

                border: '3px solid white',

                boxShadow:
                  '0 4px 12px rgba(15,23,42,0.06)',
              }}
            >
              {getInitials(employee)}
            </div>

          )
        ))}

        {/* EMPTY */}
        {Array.from({ length: placeholders }).map((_, i) => (

          <div
            key={i}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',

              background: '#f8fafc',

              border:
                '2px dashed #cbd5e1',
            }}
          />

        ))}

        {/* EXTRA */}
        {extraEmployees > 0 && (

          <div
            style={{
              height: 56,
              padding: '0 18px',

              borderRadius: 999,

              background: '#cffafe',

              color: '#0891b2',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              fontSize: 14,
              fontWeight: 600,
            }}
          >
            +{extraEmployees}
          </div>

        )}

      </div>

      {/* FOOTER */}
      {showExtraMessage && (

        <p
          style={{
            marginTop: 24,
            marginBottom: 0,

            fontSize: 14,

            color: '#64748b',
          }}
        >
          Cada empleado adicional añade 1€/mes
          a tu suscripción.
        </p>

      )}

    </div>
  );
}