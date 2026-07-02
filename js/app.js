const ESTADOS = {
  INICIO: "INICIO",
  PRODUCTO_SELECCIONADO: "PRODUCTO_SELECCIONADO",
  ACUMULANDO_DINERO: "ACUMULANDO_DINERO",
  PAGO_COMPLETADO: "PAGO_COMPLETADO",
  CAMBIO_CALCULADO: "CAMBIO_CALCULADO",
  PRODUCTO_LISTO: "PRODUCTO_LISTO",
  ENTREGA_PRODUCTO: "ENTREGA_PRODUCTO",
  ENTREGA_CAMBIO: "ENTREGA_CAMBIO",
  REINICIO: "REINICIO"
};

const nombresEstado = {
  INICIO: "Inicio",
  PRODUCTO_SELECCIONADO: "Producto seleccionado",
  ACUMULANDO_DINERO: "Esperando monedas / Acumulando dinero",
  PAGO_COMPLETADO: "Pago completado",
  CAMBIO_CALCULADO: "Cambio calculado",
  PRODUCTO_LISTO: "Producto listo para recoger",
  ENTREGA_PRODUCTO: "Entrega del producto",
  ENTREGA_CAMBIO: "Entrega del cambio",
  REINICIO: "Reinicio de la máquina"
};

let estadoActual = ESTADOS.INICIO;
let productoSeleccionado = null;
let dineroIngresado = 0;
let cambioActual = 0;
let detalleCambioActual = [];
let historialMonedas = [];
let afdVisible = false;

const elGrid = document.getElementById("grid-productos");
const elEstado = document.getElementById("estado-actual");
const elLcd = document.getElementById("lcd-pantalla");
const elProductoSeleccionado = document.getElementById("producto-seleccionado");
const elDinero = document.getElementById("dinero-ingresado");
const elCambio = document.getElementById("cambio-calculado");
const elBotonesDinero = document.getElementById("botones-dinero");
const elHistorial = document.getElementById("historial-monedas");
const elPanelVuelto = document.getElementById("panel-vuelto");
const elBandeja = document.getElementById("bandeja-entrega");
const btnRecoger = document.getElementById("btn-recoger");
const btnCancelar = document.getElementById("btn-cancelar");
const afdSection = document.getElementById("afd-section");
const mermaidContainer = document.getElementById("mermaid-container");
const tablaTransiciones = document.getElementById("tabla-transiciones");

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "loose",
  flowchart: {
    curve: "basis"
  }
});

function cambiarEstado(nuevoEstado, mensaje) {
  estadoActual = nuevoEstado;
  elEstado.textContent = nombresEstado[nuevoEstado];
  elLcd.textContent = mensaje || nombresEstado[nuevoEstado];

  if (estadoActual === ESTADOS.PAGO_COMPLETADO && !afdVisible) {
    afdVisible = true;
    afdSection.classList.remove("d-none");
  }

  actualizarControles();
  renderizarGrafo();
  renderizarTablaTransiciones();
}

function mostrarError(mensaje) {
  elLcd.textContent = mensaje;
  elLcd.classList.remove("lcd-error");
  void elLcd.offsetWidth;
  elLcd.classList.add("lcd-error");
}

function renderizarProductos() {
  elGrid.innerHTML = "";

  productos.forEach(producto => {
    const sinStock = producto.stock <= 0;
    const seleccionado = productoSeleccionado && productoSeleccionado.codigo === producto.codigo;

    const columna = document.createElement("div");
    columna.className = "col";

    columna.innerHTML = `
      <div class="producto-card text-center ${seleccionado ? "seleccionado" : ""} ${sinStock ? "sin-stock" : ""}">
        <div class="product-icon">${producto.icono}</div>
        <div class="product-code">${producto.codigo}</div>
        <h3 class="h6 mb-1">${producto.nombre}</h3>
        <div class="text-success fw-bold mb-2">S/ ${producto.precio.toFixed(2)}</div>
        <span class="badge ${sinStock ? "bg-danger" : "bg-secondary"} stock-badge">
          Stock: ${producto.stock}
        </span>
        <button class="btn btn-sm btn-primary w-100 mt-3" ${sinStock ? "disabled" : ""}>
          Seleccionar
        </button>
      </div>
    `;

    columna.querySelector("button").addEventListener("click", () => seleccionarProducto(producto.codigo));
    elGrid.appendChild(columna);
  });
}

function renderizarBotonesDinero() {
  elBotonesDinero.innerHTML = "";

  denominacionesAceptadas.forEach(moneda => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn btn-outline-primary btn-money";
    boton.textContent = `S/${moneda.toFixed(2)}`;
    boton.addEventListener("click", () => insertarMoneda(moneda));
    elBotonesDinero.appendChild(boton);
  });
}

function actualizarVistaProducto() {
  if (!productoSeleccionado) {
    elProductoSeleccionado.textContent = "Ninguno";
    return;
  }

  elProductoSeleccionado.innerHTML = `
    <strong>${productoSeleccionado.codigo}</strong> - ${productoSeleccionado.nombre}
    <br>
    <span class="text-success">Precio: S/ ${productoSeleccionado.precio.toFixed(2)}</span>
  `;
}

function actualizarVistaDinero() {
  elDinero.textContent = `S/ ${dineroIngresado.toFixed(2)}`;
  elCambio.textContent = `S/ ${cambioActual.toFixed(2)}`;
}

function actualizarHistorial() {
  if (!historialMonedas.length) {
    elHistorial.textContent = "Sin monedas ingresadas.";
    return;
  }

  elHistorial.innerHTML = historialMonedas
    .map(moneda => `<span class="badge text-bg-primary me-1 mb-1">S/${moneda.toFixed(2)}</span>`)
    .join("");
}

function actualizarPanelVuelto() {
  if (cambioActual <= 0) {
    elPanelVuelto.textContent = "S/ 0.00";
    return;
  }

  const lineas = formatearDetalleVuelto(detalleCambioActual);

  elPanelVuelto.innerHTML = `
    <strong>Cambio: S/ ${cambioActual.toFixed(2)}</strong>
    <ul class="mb-0 mt-2">
      ${lineas.map(linea => `<li>${linea}</li>`).join("")}
    </ul>
  `;
}

function actualizarControles() {
  const puedeInsertar = [
    ESTADOS.PRODUCTO_SELECCIONADO,
    ESTADOS.ACUMULANDO_DINERO
  ].includes(estadoActual);

  const puedeRecoger = estadoActual === ESTADOS.PRODUCTO_LISTO;

  Array.from(elBotonesDinero.children).forEach(boton => {
    boton.disabled = !puedeInsertar;
  });

  btnRecoger.disabled = !puedeRecoger;
}

function seleccionarProducto(codigo) {
  const producto = buscarProductoPorCodigo(codigo);

  if (!tieneStock(producto)) {
    mostrarError("Producto sin stock.");
    return;
  }

  productoSeleccionado = producto;
  dineroIngresado = 0;
  cambioActual = 0;
  detalleCambioActual = [];
  historialMonedas = [];

  actualizarVistaProducto();
  actualizarVistaDinero();
  actualizarHistorial();
  actualizarPanelVuelto();
  renderizarProductos();

  cambiarEstado(
    ESTADOS.PRODUCTO_SELECCIONADO,
    `Producto ${producto.nombre} seleccionado. Inserte monedas.`
  );
}

function insertarMoneda(moneda) {
  if (!productoSeleccionado) {
    mostrarError("Primero seleccione un producto.");
    return;
  }

  if (!esMonedaValida(moneda)) {
    mostrarError("Moneda no aceptada.");
    return;
  }

  dineroIngresado = aSoles(aCentimos(dineroIngresado) + aCentimos(moneda));
  historialMonedas.push(moneda);

  actualizarVistaDinero();
  actualizarHistorial();

  if (dineroIngresado >= productoSeleccionado.precio) {
    completarPago();
  } else {
    const faltante = productoSeleccionado.precio - dineroIngresado;

    cambiarEstado(
      ESTADOS.ACUMULANDO_DINERO,
      `Monto insuficiente. Falta S/ ${faltante.toFixed(2)}.`
    );
  }
}

function completarPago() {
  cambioActual = aSoles(aCentimos(dineroIngresado) - aCentimos(productoSeleccionado.precio));
  detalleCambioActual = calcularVuelto(cambioActual);

  actualizarVistaDinero();
  actualizarPanelVuelto();

  cambiarEstado(
    ESTADOS.PAGO_COMPLETADO,
    "Pago completado. Calculando cambio..."
  );

  setTimeout(() => {
    cambiarEstado(
      ESTADOS.CAMBIO_CALCULADO,
      `Cambio calculado: S/ ${cambioActual.toFixed(2)}.`
    );

    setTimeout(() => {
      cambiarEstado(
        ESTADOS.PRODUCTO_LISTO,
        "Producto listo. Presione Recoger producto."
      );
    }, 600);
  }, 600);
}

function recogerProducto() {
  if (estadoActual !== ESTADOS.PRODUCTO_LISTO || !productoSeleccionado) {
    return;
  }

  cambiarEstado(
    ESTADOS.ENTREGA_PRODUCTO,
    "Entregando producto..."
  );

  elBandeja.innerHTML = `
    <div class="entrega-animada text-center">
      <div class="product-icon">${productoSeleccionado.icono}</div>
      <strong>${productoSeleccionado.nombre}</strong>
      <br>
      <span class="text-muted">Código: ${productoSeleccionado.codigo}</span>
    </div>
  `;

  setTimeout(() => {
    cambiarEstado(
      ESTADOS.ENTREGA_CAMBIO,
      cambioActual > 0 ? "Entregando cambio..." : "Pago exacto. No hay cambio."
    );

    const productoEntregado = productoSeleccionado;
    const cambioEntregado = cambioActual;
    const detalleEntregado = [...detalleCambioActual];

    descontarStock(productoEntregado);
    renderizarProductos();

    if (cambioEntregado > 0) {
      elPanelVuelto.innerHTML = `
        <strong>Cambio entregado: S/ ${cambioEntregado.toFixed(2)}</strong>
        <ul class="mb-0 mt-2">
          ${formatearDetalleVuelto(detalleEntregado).map(linea => `<li>${linea}</li>`).join("")}
        </ul>
      `;
    } else {
      elPanelVuelto.textContent = "Pago exacto. No hay cambio.";
    }

    setTimeout(() => {
      reiniciarMaquina();
    }, 1800);
  }, 900);
}

function cancelarCompra() {
  if (estadoActual === ESTADOS.INICIO) {
    mostrarError("No hay compra activa.");
    return;
  }

  const montoDevuelto = dineroIngresado;
  const detalleDevolucion = calcularVuelto(montoDevuelto);

  if (montoDevuelto > 0) {
    elPanelVuelto.innerHTML = `
      <strong>Devolución: S/ ${montoDevuelto.toFixed(2)}</strong>
      <ul class="mb-0 mt-2">
        ${formatearDetalleVuelto(detalleDevolucion).map(linea => `<li>${linea}</li>`).join("")}
      </ul>
    `;
  }

  cambiarEstado(ESTADOS.REINICIO, "Compra cancelada. Reiniciando...");

  setTimeout(() => {
    reiniciarMaquina();
  }, 1200);
}

function reiniciarMaquina() {
  productoSeleccionado = null;
  dineroIngresado = 0;
  cambioActual = 0;
  detalleCambioActual = [];
  historialMonedas = [];

  actualizarVistaProducto();
  actualizarVistaDinero();
  actualizarHistorial();

  elBandeja.textContent = "Vacía.";
  elPanelVuelto.textContent = "S/ 0.00";

  renderizarProductos();

  cambiarEstado(ESTADOS.INICIO, "Seleccione un producto.");
}
function obtenerEstadosAFD() {
  return [
    { id: "q0", monto: 0.00, texto: "S/ 0.00", tipo: "inicial" },
    { id: "q1", monto: 0.10, texto: "S/ 0.10" },
    { id: "q2", monto: 0.20, texto: "S/ 0.20" },
    { id: "q5", monto: 0.50, texto: "S/ 0.50" },
    { id: "q6", monto: 1.00, texto: "S/ 1.00" },
    { id: "q8", monto: 2.00, texto: "S/ 2.00" },
    { id: "q14", monto: 5.00, texto: "S/ 5.00 o más", tipo: "aceptacion" }
  ];
}
function obtenerEstadoAceptacionAFD() {
  const precioObjetivo = productoSeleccionado ? productoSeleccionado.precio : 5.00;
  const estados = obtenerEstadosAFD();
  const estadoAceptacion = estados.find(estado => estado.monto >= precioObjetivo);
  return estadoAceptacion ? estadoAceptacion.id : "q14";
}
function obtenerEstadoPorMonto(monto) {

    const precioObjetivo = productoSeleccionado
        ? productoSeleccionado.precio
        : 5.00;

    const montoRedondeado = Math.round(monto * 100) / 100;

    if (montoRedondeado >= precioObjetivo) {
        return "q14";
    }

    const estados = obtenerEstadosAFD();

    const estadoExacto = estados.find(
        estado => estado.monto === montoRedondeado
    );

    if (estadoExacto) {
        return estadoExacto.id;
    }

    let estadoCercano = estados[0];

    estados.forEach(estado => {
        if (
            estado.monto <= montoRedondeado &&
            estado.monto > estadoCercano.monto &&
            estado.id !== "q14"
        ) {
            estadoCercano = estado;
        }
    });

    return estadoCercano.id;
}

function obtenerEstadoActualAFD() {

    if (
        estadoActual === ESTADOS.PAGO_COMPLETADO ||
        estadoActual === ESTADOS.CAMBIO_CALCULADO ||
        estadoActual === ESTADOS.PRODUCTO_LISTO ||
        estadoActual === ESTADOS.ENTREGA_PRODUCTO ||
        estadoActual === ESTADOS.ENTREGA_CAMBIO
    ) {
        return "q14";
    }

    return obtenerEstadoPorMonto(dineroIngresado);

}

function transicionPorMoneda(montoActual, moneda) {
  const nuevoMonto = Math.round((montoActual + moneda) * 100) / 100;
  return obtenerEstadoPorMonto(nuevoMonto);
}

function renderizarGrafo() {
  if (!afdVisible) {
    return;
  }

  const precioObjetivo = productoSeleccionado
  ? productoSeleccionado.precio
  : 5.00;

const estadoAceptacion = obtenerEstadoAceptacionAFD();

  const estadoActivo = obtenerEstadoActualAFD();

  const graph = `
flowchart LR
  inicio((Inicio)) --> q0

  q0(("q0<br/>S/ 0.00<br/>depositado"))
  q1(("q1<br/>S/ 0.10<br/>depositado"))
  q2(("q2<br/>S/ 0.20<br/>depositado"))
  q3(("q3<br/>S/ 0.30<br/>depositado"))
  q4(("q4<br/>S/ 0.40<br/>depositado"))
  q5(("q5<br/>S/ 0.50<br/>depositado"))
  q6(("q6<br/>S/ 1.00<br/>depositado"))
  q7(("q7<br/>S/ 1.50<br/>depositado"))
  q8(("q8<br/>S/ 2.00<br/>depositado"))
  q9(("q9<br/>S/ 2.50<br/>depositado"))
  q10(("q10<br/>S/ 3.00<br/>depositado"))
  q11(("q11<br/>S/ 3.50<br/>depositado"))
  q12(("q12<br/>S/ 4.00<br/>depositado"))
  q13(("q13<br/>S/ 4.50<br/>depositado"))
  q14((("q14<br/>S/ ${precioObjetivo.toFixed(2)} <br/>Pago completado")))

  q0 -->|"S/ 0.10"| q1
  q1 -->|"S/ 0.10"| q2
  q2 -->|"S/ 0.10"| q3
  q3 -->|"S/ 0.10"| q4
  q4 -->|"S/ 0.10"| q5

  q0 -->|"S/ 0.20"| q2
  q1 -->|"S/ 0.20"| q3
  q2 -->|"S/ 0.20"| q4
  q3 -->|"S/ 0.20"| q5

  q0 -->|"S/ 0.50"| q5
  q5 -->|"S/ 0.50"| q6
  q6 -->|"S/ 0.50"| q7
  q7 -->|"S/ 0.50"| q8
  q8 -->|"S/ 0.50"| q9
  q9 -->|"S/ 0.50"| q10
  q10 -->|"S/ 0.50"| q11
  q11 -->|"S/ 0.50"| q12
  q12 -->|"S/ 0.50"| q13
  q13 -->|"S/ 0.50"| q14

  q0 -->|"S/ 1.00"| q6
  q1 -->|"S/ 1.00"| q6
  q5 -->|"S/ 1.00"| q7
  q6 -->|"S/ 1.00"| q8
  q7 -->|"S/ 1.00"| q9
  q8 -->|"S/ 1.00"| q10
  q9 -->|"S/ 1.00"| q11
  q10 -->|"S/ 1.00"| q12
  q11 -->|"S/ 1.00"| q13
  q12 -->|"S/ 1.00"| q14
  q13 -->|"S/ 1.00"| q14

  q0 -->|"S/ 2.00"| q8
  q1 -->|"S/ 2.00"| q8
  q5 -->|"S/ 2.00"| q9
  q6 -->|"S/ 2.00"| q10
  q7 -->|"S/ 2.00"| q11
  q8 -->|"S/ 2.00"| q12
  q9 -->|"S/ 2.00"| q13
  q10 -->|"S/ 2.00"| q14
  q11 -->|"S/ 2.00"| q14
  q12 -->|"S/ 2.00"| q14
  q13 -->|"S/ 2.00"| q14

  q0 -->|"S/ 5.00"| q14
  q1 -->|"S/ 5.00"| q14
  q2 -->|"S/ 5.00"| q14
  q3 -->|"S/ 5.00"| q14
  q4 -->|"S/ 5.00"| q14
  q5 -->|"S/ 5.00"| q14
  q6 -->|"S/ 5.00"| q14
  q7 -->|"S/ 5.00"| q14
  q8 -->|"S/ 5.00"| q14
  q9 -->|"S/ 5.00"| q14
  q10 -->|"S/ 5.00"| q14
  q11 -->|"S/ 5.00"| q14
  q12 -->|"S/ 5.00"| q14
  q13 -->|"S/ 5.00"| q14

  q14 -->|"Recoger producto"| entrega["Entrega producto y cambio"]
  entrega -->|"Reinicio"| q0

  classDef inicial fill:#dff3df,stroke:#2e7d32,stroke-width:3px,color:#111;
  classDef normal fill:#eaf2ff,stroke:#345995,stroke-width:2px,color:#111;
  classDef aceptacion fill:#ffe6e6,stroke:#a00000,stroke-width:4px,color:#111;
  classDef actual fill:#fff3cd,stroke:#b8860b,stroke-width:5px,color:#111;

  class q0 inicial;
  class q1,q2,q3,q4,q5,q6,q7,q8,q9,q10,q11,q12,q13 normal;
  class q14 aceptacion;
  class ${estadoActivo} actual;
`;

  mermaidContainer.innerHTML = `<div class="mermaid">${graph}</div>`;

  mermaid.run({
    nodes: [mermaidContainer.querySelector(".mermaid")]
  });
}

function renderizarTablaTransiciones() {
  if (!afdVisible) {
    return;
  }

  const estados = obtenerEstadosAFD();
  const monedas = [0.10, 0.20, 0.50, 1.00, 2.00, 5.00];
  const estadoActivo = obtenerEstadoActualAFD();

  tablaTransiciones.innerHTML = "";

  estados.forEach(estado => {
    const fila = document.createElement("tr");

    if (estado.id === estadoActivo) {
      fila.classList.add("estado-activo");
    }

    const celdaEstado = document.createElement("td");

    if (estado.id === "q0") {
      celdaEstado.innerHTML = `➜ <strong>${estado.id}</strong><br><small>${estado.texto} depositado<br>(Estado inicial)</small>`;
    } else if (estado.id === "q14") {
      celdaEstado.innerHTML = `★ <strong>${estado.id}</strong><br><small>${estado.texto}<br>(Pago completado)</small>`;
    } else {
      celdaEstado.innerHTML = `<strong>${estado.id}</strong><br><small>${estado.texto} depositado</small>`;
    }

    fila.appendChild(celdaEstado);

    monedas.forEach(moneda => {
      const celda = document.createElement("td");
      const siguienteEstado = estado.id === "q14"
        ? "q14"
        : transicionPorMoneda(estado.monto, moneda);

      celda.textContent = siguienteEstado;

      if (siguienteEstado === "q14") {
        celda.classList.add("table-success");
      }

      fila.appendChild(celda);
    });

    const celdaRecoger = document.createElement("td");

    if (estado.id === "q14") {
      celdaRecoger.innerHTML = `<strong>Entrega producto</strong>`;
      celdaRecoger.classList.add("table-warning");
    } else {
      celdaRecoger.textContent = estado.id;
    }

    fila.appendChild(celdaRecoger);

    const celdaCancelar = document.createElement("td");
    celdaCancelar.textContent = "q0";
    fila.appendChild(celdaCancelar);

    tablaTransiciones.appendChild(fila);
  });
}



function nombreTransicion(valor) {
  return nombresEstado[valor] || valor;
}

function iniciarApp() {
  renderizarProductos();
  renderizarBotonesDinero();
  renderizarTablaTransiciones();

  btnRecoger.addEventListener("click", recogerProducto);
  btnCancelar.addEventListener("click", cancelarCompra);

  cambiarEstado(ESTADOS.INICIO, "Seleccione un producto.");
}

document.addEventListener("DOMContentLoaded", iniciarApp);