'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Componente cliente compartido por las páginas /pago-completado,
 * /pago-fallido y /pago-pendiente. Lee los query params que devuelve
 * Mercado Pago (payment_id, status, external_reference) y los muestra.
 */
export default function PagoResultClient({ tipo, titulo, mensaje, color }) {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  return (
    <div
      style={{
        backgroundColor: 'var(--blanco)',
        border: '1px solid var(--gris-claro)',
        borderTop: `4px solid ${color}`,
        padding: '40px 32px',
        textAlign: 'center',
        fontFamily: 'var(--fuente-sans)',
      }}
    >
      <p
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: color,
          fontWeight: 700,
          margin: 0,
        }}
      >
        {tipo === 'success'
          ? 'Pago aprobado'
          : tipo === 'failure'
          ? 'Pago rechazado'
          : 'Pago en proceso'}
      </p>

      <h1
        style={{
          fontSize: '1.4rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          fontWeight: 700,
          margin: '12px 0 0 0',
          color: 'var(--negro)',
        }}
      >
        {titulo}
      </h1>

      <p
        style={{
          fontSize: '0.85rem',
          color: 'var(--gris-oscuro)',
          marginTop: '16px',
          marginBottom: 0,
          lineHeight: 1.5,
        }}
      >
        {mensaje}
      </p>

      {(paymentId || externalReference) && (
        <dl
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--gris-claro)',
            display: 'grid',
            gap: '8px',
            textAlign: 'left',
            fontSize: '0.75rem',
          }}
        >
          {paymentId && (
            <div>
              <dt
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--gris-medio)',
                  marginBottom: '2px',
                }}
              >
                ID de pago (Mercado Pago)
              </dt>
              <dd style={{ margin: 0, fontFamily: 'monospace' }}>
                {paymentId}
              </dd>
            </div>
          )}
          {externalReference && (
            <div>
              <dt
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--gris-medio)',
                  marginBottom: '2px',
                }}
              >
                Referencia de orden
              </dt>
              <dd style={{ margin: 0, fontFamily: 'monospace' }}>
                {externalReference}
              </dd>
            </div>
          )}
          {status && (
            <div>
              <dt
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--gris-medio)',
                  marginBottom: '2px',
                }}
              >
                Estado MP
              </dt>
              <dd style={{ margin: 0, textTransform: 'uppercase' }}>
                {status}
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
