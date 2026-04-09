/**
 * src/data/services/external.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Datos (Capa 3)
 * Servicios para interactuar con APIs externas (Reniec, Sunat, etc.) de manera pura.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const externalService = {
  /**
   * Consulta datos de un DNI en RENIEC.
   * @param {string} dni
   * @returns {Promise<Object|null>}
   */
  getPersonaByDni: async (dni) => {
    if (!dni || dni.length !== 8) return null;

    try {
      const res = await fetch(`https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`, {
        headers: {
          'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1hdHRoZXd0YW5kYXlwYW4wMDdAZ21haWwuY29tIn0.N_GBdyXAljx7Qrl9h-8wX96smNwGu0Hcah-t4jKloH0',
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Error en API Externa: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
       console.error("externalService.getPersonaByDni falló:", err);
       return null;
    }
  }
};
