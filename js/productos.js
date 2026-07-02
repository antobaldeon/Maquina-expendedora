const productos = [
  {
    codigo: "A1",
    nombre: "Agua",
    precio: 2.00,
    stock: 5,
    icono: "💧"
  },
  {
    codigo: "A2",
    nombre: "Gaseosa",
    precio: 3.50,
    stock: 4,
    icono: "🥤"
  },
  {
    codigo: "A3",
    nombre: "Jugo",
    precio: 3.00,
    stock: 4,
    icono: "🧃"
  },
  {
    codigo: "B1",
    nombre: "Café",
    precio: 2.80,
    stock: 3,
    icono: "☕"
  },
  {
    codigo: "B2",
    nombre: "Energizante",
    precio: 4.70,
    stock: 3,
    icono: "⚡"
  },
  {
    codigo: "B3",
    nombre: "Té",
    precio: 1.60,
    stock: 6,
    icono: "🍵"
  }
];

const denominacionesAceptadas = [0.10, 0.20, 0.50, 1.00, 2.00, 5.00];

function buscarProductoPorCodigo(codigo) {
  return productos.find(producto => producto.codigo === codigo);
}

function tieneStock(producto) {
  return Boolean(producto && producto.stock > 0);
}

function descontarStock(producto) {
  if (tieneStock(producto)) {
    producto.stock -= 1;
  }
}

function esMonedaValida(valor) {
  return denominacionesAceptadas.includes(valor);
}