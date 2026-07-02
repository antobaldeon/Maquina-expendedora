const monedasParaCambio = [5.00, 2.00, 1.00, 0.50, 0.20, 0.10];

function aCentimos(monto) {
  return Math.round(monto * 100);
}

function aSoles(centimos) {
  return Math.round(centimos) / 100;
}

function calcularVuelto(monto) {
  let restante = aCentimos(monto);
  const detalle = [];

  for (const moneda of monedasParaCambio) {
    const valorMoneda = aCentimos(moneda);
    const cantidad = Math.floor(restante / valorMoneda);

    if (cantidad > 0) {
      detalle.push({
        moneda,
        cantidad
      });

      restante -= cantidad * valorMoneda;
    }
  }

  return detalle;
}

function formatearDetalleVuelto(detalle) {
  if (!detalle.length) {
    return ["No hay cambio."];
  }

  return detalle.map(item => {
    const palabra = item.cantidad === 1 ? "moneda" : "monedas";
    return `${item.cantidad} ${palabra} de S/${item.moneda.toFixed(2)}`;
  });
}