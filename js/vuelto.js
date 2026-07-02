/* ===========================================================
   vuelto.js
   Algoritmo Greedy (voraz) para calcular el vuelto
   utilizando la menor cantidad de monedas posible.
   =========================================================== */

// Denominaciones de monedas peruanas usadas para el vuelto,
// ordenadas de mayor a menor (requisito del algoritmo greedy).
const monedasVuelto = [5.00, 2.00, 1.00, 0.50, 0.20, 0.10];

/**
 * Calcula el vuelto usando un algoritmo Greedy.
 * Se trabaja en CÉNTIMOS (enteros) para evitar errores
 * de precisión con números decimales (0.1 + 0.2 != 0.3 en JS).
 *
 * @param {number} monto - Monto de vuelto a entregar (en soles)
 * @returns {Array<{moneda:number, cantidad:number}>} detalle del vuelto
 */
function calcularVuelto(monto) {
  let montoCentimos = Math.round(monto * 100); // pasar a céntimos
  const detalle = [];

  for (const moneda of monedasVuelto) {
    const monedaCentimos = Math.round(moneda * 100);
    const cantidad = Math.floor(montoCentimos / monedaCentimos);

    if (cantidad > 0) {
      detalle.push({ moneda: moneda, cantidad: cantidad });
      montoCentimos -= cantidad * monedaCentimos;
    }
  }

  return detalle;
}

/**
 * Convierte el detalle del vuelto en un arreglo de textos legibles.
 * Ej: "1 moneda de S/2.00"
 * @param {Array} detalle
 * @returns {Array<string>}
 */
function formatearDetalleVuelto(detalle) {
  return detalle.map(item => {
    const etiqueta = item.cantidad === 1 ? "moneda" : "monedas";
    return `${item.cantidad} ${etiqueta} de S/${item.moneda.toFixed(2)}`;
  });
}