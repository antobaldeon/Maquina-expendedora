/* ===========================================================
   app.js
   Controlador principal de la aplicación.
   Implementa la MÁQUINA DE ESTADOS FINITOS (FSM):

   INICIO
     -> ESPERANDO_SELECCION
     -> ESPERANDO_DINERO
     -> VERIFICANDO_COMPRA
        -> (dinero insuficiente) -> ESPERANDO_DINERO
        -> (stock == 0)          -> ESPERANDO_SELECCION
        -> (ok) -> ENTREGANDO_PRODUCTO -> CALCULANDO_VUELTO -> FIN_COMPRA
     -> REINICIO -> ESPERANDO_SELECCION
   =========================================================== */

// ---------- ESTADOS DE LA MÁQUINA ----------
const ESTADOS = {
  ESPERANDO_SELECCION: "ESPERANDO_SELECCION",
  ESPERANDO_DINERO:    "ESPERANDO_DINERO",
  VERIFICANDO_COMPRA:  "VERIFICANDO_COMPRA",
  ENTREGANDO:          "ENTREGANDO",
  FIN_COMPRA:          "FIN_COMPRA",
};

// ---------- VARIABLES DE ESTADO GLOBAL ----------
let estadoActual = ESTADOS.ESPERANDO_SELECCION;
let productoSeleccionado = null;
let dineroIngresado = 0;

// ---------- REFERENCIAS AL DOM ----------
const elGrid          = document.getElementById("grid-productos");
const elLcd           = document.getElementById("lcd-pantalla");
const elProdSel       = document.getElementById("producto-seleccionado");
const elDinero        = document.getElementById("dinero-ingresado");
const elBotonesDinero = document.getElementById("botones-dinero");
const elBandeja       = document.getElementById("bandeja-entrega");
const elPanelVuelto   = document.getElementById("panel-vuelto");
const btnComprar      = document.getElementById("btn-comprar");
const btnCancelar     = document.getElementById("btn-cancelar");

// ===========================================================
// FUNCIONES DE RENDERIZADO (dibujan la UI según el estado)
// ===========================================================

/** Dibuja el catálogo completo de productos en la grilla. */
function renderizarProductos() {
  elGrid.innerHTML = "";

  productos.forEach(producto => {
    const sinStock = producto.stock <= 0;
    const estaSeleccionado = productoSeleccionado && productoSeleccionado.codigo === producto.codigo;

    const col = document.createElement("div");
    col.className = "col";

    col.innerHTML = `
      <div class="producto-card text-center p-2 ${estaSeleccionado ? "seleccionado" : ""} ${sinStock ? "sin-stock" : ""}"
           data-codigo="${producto.codigo}">
        <img src="${producto.imagen}" onerror="this.onerror=null;this.src='${imagenRespaldo(producto)}'"
             class="producto-img mb-2" alt="${producto.nombre}">
        <div class="producto-codigo">${producto.codigo}</div>
        <div class="fw-semibold small">${producto.nombre}</div>
        <div class="text-success fw-bold">S/ ${producto.precio.toFixed(2)}</div>
        <span class="badge stock-badge ${sinStock ? "bg-danger" : "bg-secondary"}">
          Stock: ${producto.stock}
        </span>
      </div>
    `;

    // Evento click -> seleccionar producto
    col.querySelector(".producto-card").addEventListener("click", () => {
      seleccionarProducto(producto.codigo);
    });

    elGrid.appendChild(col);
  });
}

/** Dibuja los botones de monedas/billetes. */
function renderizarBotonesDinero() {
  elBotonesDinero.innerHTML = "";
  denominaciones.forEach(valor => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary btn-dinero";
    btn.textContent = `S/${valor.toFixed(2)}`;
    btn.addEventListener("click", () => insertarDinero(valor));
    elBotonesDinero.appendChild(btn);
  });
}

/** Actualiza el texto de la pantalla LCD. */
function mostrarMensajeLCD(mensaje, esError = false) {
  elLcd.textContent = mensaje;
  elLcd.classList.remove("lcd-error");
  if (esError) {
    // Forzar reinicio de animación
    void elLcd.offsetWidth;
    elLcd.classList.add("lcd-error");
  }
}

/** Refresca el monto de dinero ingresado en pantalla. */
function actualizarVistaDinero() {
  elDinero.textContent = `S/ ${dineroIngresado.toFixed(2)}`;
}

/** Refresca el bloque de "producto seleccionado". */
function actualizarVistaProductoSeleccionado() {
  if (productoSeleccionado) {
    elProdSel.innerHTML = `
      <strong>${productoSeleccionado.codigo}</strong> - ${productoSeleccionado.nombre}
      <br><span class="text-success">S/ ${productoSeleccionado.precio.toFixed(2)}</span>
    `;
  } else {
    elProdSel.innerHTML = `<span class="text-muted">Ninguno</span>`;
  }
}

// ===========================================================
// FUNCIONES DE LA MÁQUINA DE ESTADOS (transiciones)
// ===========================================================

/**
 * Cambia el estado actual de la máquina y actualiza la interfaz
 * en consecuencia. Punto central de la FSM.
 */
function cambiarEstado(nuevoEstado) {
  estadoActual = nuevoEstado;

  switch (estadoActual) {
    case ESTADOS.ESPERANDO_SELECCION:
      mostrarMensajeLCD("SELECCIONE UN PRODUCTO");
      break;
    case ESTADOS.ESPERANDO_DINERO:
      mostrarMensajeLCD(`INSERTE DINERO (falta S/${(productoSeleccionado.precio - dineroIngresado).toFixed(2)})`);
      break;
    case ESTADOS.VERIFICANDO_COMPRA:
      mostrarMensajeLCD("VERIFICANDO COMPRA...");
      break;
    case ESTADOS.ENTREGANDO:
      mostrarMensajeLCD("PRODUCTO ENTREGADO");
      break;
    case ESTADOS.FIN_COMPRA:
      mostrarMensajeLCD("GRACIAS POR SU COMPRA");
      break;
  }
}

/**
 * FUNCIÓN: Seleccionar producto
 * Transición: ESPERANDO_SELECCION -> ESPERANDO_DINERO
 */
function seleccionarProducto(codigo) {
  const producto = buscarProductoPorCodigo(codigo);

  if (!tieneStock(producto)) {
    mostrarMensajeLCD("PRODUCTO SIN STOCK", true);
    return;
  }

  productoSeleccionado = producto;
  actualizarVistaProductoSeleccionado();
  renderizarProductos(); // re-dibuja para resaltar la selección

  cambiarEstado(ESTADOS.ESPERANDO_DINERO);
}

/**
 * FUNCIÓN: Insertar dinero
 * Se mantiene en el estado ESPERANDO_DINERO, acumulando el monto.
 */
function insertarDinero(valor) {
  if (!productoSeleccionado) {
    mostrarMensajeLCD("PRIMERO SELECCIONE UN PRODUCTO", true);
    return;
  }

  dineroIngresado += valor;
  // Redondeo a 2 decimales para evitar errores de punto flotante
  dineroIngresado = Math.round(dineroIngresado * 100) / 100;

  actualizarVistaDinero();
  cambiarEstado(ESTADOS.ESPERANDO_DINERO);
}

/**
 * FUNCIÓN: Validar compra
 * Transición: ESPERANDO_DINERO -> VERIFICANDO_COMPRA -> (ENTREGANDO | error)
 */
function validarCompra() {
  if (!productoSeleccionado) {
    mostrarMensajeLCD("SELECCIONE UN PRODUCTO", true);
    return;
  }

  cambiarEstado(ESTADOS.VERIFICANDO_COMPRA);

  // Validación 1: stock
  if (!tieneStock(productoSeleccionado)) {
    mostrarMensajeLCD("SIN STOCK DISPONIBLE", true);
    cambiarEstado(ESTADOS.ESPERANDO_SELECCION);
    productoSeleccionado = null;
    return;
  }

  // Validación 2: dinero suficiente
  if (dineroIngresado < productoSeleccionado.precio) {
    const faltante = (productoSeleccionado.precio - dineroIngresado).toFixed(2);
    mostrarMensajeLCD(`DINERO INSUFICIENTE - FALTA S/${faltante}`, true);
    cambiarEstado(ESTADOS.ESPERANDO_DINERO);
    return;
  }

  // Si todo es válido -> entregar producto
  procesarCompra();
}

/**
 * FUNCIÓN: Procesar compra (entrega + vuelto)
 * Transición: VERIFICANDO_COMPRA -> ENTREGANDO -> FIN_COMPRA
 */
function procesarCompra() {
  // 1. Reducir stock
  actualizarStock(productoSeleccionado);

  // 2. Mostrar entrega en la bandeja con animación
  elBandeja.innerHTML = `
    <div class="animar-entrega">
      <img src="${productoSeleccionado.imagen}" onerror="this.onerror=null;this.src='${imagenRespaldo(productoSeleccionado)}'"
           class="producto-img mb-1" alt="${productoSeleccionado.nombre}">
      <div class="fw-bold">${productoSeleccionado.nombre}</div>
      <small class="text-muted">Código: ${productoSeleccionado.codigo}</small>
    </div>
  `;
  cambiarEstado(ESTADOS.ENTREGANDO);

  // 3. Calcular vuelto con algoritmo Greedy
  const montoVuelto = Math.round((dineroIngresado - productoSeleccionado.precio) * 100) / 100;
  mostrarVuelto(montoVuelto);

  // 4. Actualizar catálogo (nuevo stock)
  renderizarProductos();

  // 5. Finalizar compra y reiniciar automáticamente
  cambiarEstado(ESTADOS.FIN_COMPRA);
  setTimeout(reiniciarMaquina, 10000);
}

/**
 * FUNCIÓN: Mostrar el detalle del vuelto en pantalla.
 */
function mostrarVuelto(monto) {
  if (monto <= 0) {
    elPanelVuelto.innerHTML = `<span class="text-muted">S/ 0.00 (pago exacto)</span>`;
    return;
  }

  const detalle = calcularVuelto(monto);
  const lineas = formatearDetalleVuelto(detalle);

  elPanelVuelto.innerHTML = `
    <div class="fw-bold text-primary mb-1">Vuelto: S/ ${monto.toFixed(2)}</div>
    <ul class="mb-0 small">
      ${lineas.map(l => `<li>${l}</li>`).join("")}
    </ul>
  `;
}

/**
 * FUNCIÓN: Cancelar operación
 * Devuelve el dinero ingresado (si lo hay) y reinicia la selección.
 */
function cancelarOperacion() {
  if (dineroIngresado > 0) {
    const detalle = calcularVuelto(dineroIngresado);
    const lineas = formatearDetalleVuelto(detalle);
    elPanelVuelto.innerHTML = `
      <div class="fw-bold text-warning mb-1">Devolución: S/ ${dineroIngresado.toFixed(2)}</div>
      <ul class="mb-0 small">${lineas.map(l => `<li>${l}</li>`).join("")}</ul>
    `;
  }
  mostrarMensajeLCD("OPERACIÓN CANCELADA", true);
  setTimeout(reiniciarMaquina, 2000);
}

/**
 * FUNCIÓN: Reiniciar la máquina
 * Transición: FIN_COMPRA -> ESPERANDO_SELECCION
 * Limpia el dinero ingresado y la selección, mantiene el stock actualizado.
 */
function reiniciarMaquina() {
  productoSeleccionado = null;
  dineroIngresado = 0;

  actualizarVistaDinero();
  actualizarVistaProductoSeleccionado();
  elBandeja.innerHTML = `<span class="text-muted">Vacía</span>`;
  elPanelVuelto.innerHTML = `<span class="text-muted">S/ 0.00</span>`;

  renderizarProductos();
  cambiarEstado(ESTADOS.ESPERANDO_SELECCION);
}

// ===========================================================
// EVENTOS PRINCIPALES
// ===========================================================
btnComprar.addEventListener("click", validarCompra);
btnCancelar.addEventListener("click", cancelarOperacion);

// ===========================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ===========================================================
function iniciarApp() {
  renderizarProductos();
  renderizarBotonesDinero();
  actualizarVistaDinero();
  actualizarVistaProductoSeleccionado();
  cambiarEstado(ESTADOS.ESPERANDO_SELECCION);
}

document.addEventListener("DOMContentLoaded", iniciarApp);