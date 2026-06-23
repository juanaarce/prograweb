// Cliente de Mercado Pago — vive del lado server únicamente.
// El access token se lee de la env var MERCADOPAGO_ACCESS_TOKEN
// (sin prefijo NEXT_PUBLIC_) para que NO sea expuesto al cliente.
//
// Documentación del SDK v2: https://github.com/mercadopago/sdk-nodejs

import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken && process.env.NODE_ENV !== 'production') {
  // Sólo warning en dev; en prod fallaría al usar el cliente.
  console.warn(
    '[mercadopago] Falta MERCADOPAGO_ACCESS_TOKEN. ' +
      'Agregalo a .env.local para que /api/pagos/crear-preferencia funcione.'
  );
}

const mpClient = new MercadoPagoConfig({
  accessToken: accessToken || 'TEST-placeholder',
});

export { mpClient, Preference, Payment };
