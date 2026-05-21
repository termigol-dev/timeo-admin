import React, { useState } from 'react';
export default function PrivacyModal({
  userId,
  email,
  password,
  onAccepted
}) {

  const [privacyChecked, setPrivacyChecked] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 12,
        maxWidth: 600,
        width: '90%'
      }}>

        <h3>Protección de datos</h3>

        <div style={{
          height: 250,
          overflow: 'auto',
          border: '1px solid #ddd',
          padding: 10,
          marginTop: 10
        }}>
          <p>
            POLÍTICA DE PROTECCIÓN DE DATOS – TIMEO

            1. Responsable del tratamiento
            El responsable del tratamiento de los datos es:
            Pablo Esteban Losada
            CIF: 72064540C
            Domicilio: Crtra. Irún-La Coruña 60, 1F, 39650 Sta. María de Cayón (España)
            Correo electrónico: admin@timeocontrol.es

            En caso de uso de la plataforma Timeo, esta actúa como encargado del tratamiento, proporcionando la infraestructura tecnológica para la gestión del control horario.

            2. Finalidad del tratamiento
            Los datos personales serán tratados con las siguientes finalidades:
            Gestión del registro de jornada laboral
            Control de horarios, turnos y presencia
            Cumplimiento de obligaciones legales en materia laboral
            Gestión interna de recursos humanos
            Control de accesos a la aplicación

            3. Datos tratados
            Se podrán tratar las siguientes categorías de datos:
            Datos identificativos: nombre, apellidos, DNI
            Datos de contacto: email
            Datos laborales: horarios, turnos, registros de entrada y salida
            Datos técnicos: accesos a la plataforma, dispositivo utilizado

            4. Legitimación
            El tratamiento de los datos se basa en:
            Cumplimiento de una obligación legal (registro de jornada)
            Ejecución del contrato laboral
            Interés legítimo en la organización y control de la actividad laboral

            5. Conservación de los datos
            Los datos se conservarán:
            Durante la relación laboral
            Posteriormente, durante los plazos exigidos por la legislación vigente
            (actualmente, 4 años para el registro de jornada)

            6. Destinatarios
            Los datos podrán ser comunicados a:
            Administraciones públicas competentes (Inspección de Trabajo, Seguridad Social)
            Proveedores tecnológicos necesarios para el funcionamiento del servicio
            No se realizarán cesiones adicionales sin base legal.

            7. Derechos de los usuarios
            El usuario puede ejercer los siguientes derechos:
            Acceso
            Rectificación
            Supresión
            Limitación del tratamiento
            Oposición
          </p>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'flex', gap: 8 }}>
            <input
              type="checkbox"
              checked={privacyChecked}
              onChange={(e) => setPrivacyChecked(e.target.checked)}
            />
            He leído y acepto la política
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>

          <button
            onClick={() => {
              alert('No podrás usar Timeo sin aceptar la política');
              window.location.reload();
            }}
          >
            No aceptar
          </button>

          <button
            disabled={!privacyChecked}
            onClick={async () => {

              await fetch(
                `${import.meta.env.VITE_API_URL}/auth/${userId}/accept-privacy`,
                { method: 'POST' }
              );

              const res = await fetch(
                `${import.meta.env.VITE_API_URL}/auth/login`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password }),
                }
              );

              const data = await res.json();

              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));

              onAccepted(data);
            }}
          >
            Aceptar y continuar
          </button>

        </div>

      </div>
    </div>
  );
}