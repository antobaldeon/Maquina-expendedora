/* ===========================================================
   productos.js
   Contiene el catálogo de productos (arreglo de objetos)
   y funciones puras relacionadas con el manejo del inventario.
   =========================================================== */

// Catálogo de productos: cada producto es un objeto con
// código, nombre, precio, stock e imagen.
const productos = [
  { codigo: "A1", nombre: "Coca Cola",     precio: 3.50, stock: 5, imagen: "img/productos/A1.png" },
  { codigo: "A2", nombre: "Agua Mineral",  precio: 2.00, stock: 5, imagen: "img/productos/A2.png" },
  { codigo: "A3", nombre: "Jugo de Fruta", precio: 3.00, stock: 2, imagen: "img/productos/A3.png" },
  { codigo: "B1", nombre: "Papas Fritas",  precio: 2.50, stock: 4, imagen: "img/productos/B1.png" },
  { codigo: "B2", nombre: "Galletas",      precio: 1.50, stock: 6, imagen: "img/productos/B2.png" },
  { codigo: "B3", nombre: "Chocolate",     precio: 4.00, stock: 3, imagen: "img/productos/B3.png" },
  { codigo: "C1", nombre: "Chicles",       precio: 1.00, stock: 8, imagen: "img/productos/C1.png" },
  { codigo: "C2", nombre: "Café Instant.", precio: 2.80, stock: 2, imagen: "img/productos/C2.png" },
  { codigo: "C3", nombre: "Snack Mixto",   precio: 3.20, stock: 5, imagen: "img/productos/C3.png" },
];

// Denominaciones de dinero peruano aceptadas por la máquina
const denominaciones = [0.10, 0.20, 0.50, 1.00, 2.00, 5.00];

/**
 * Busca un producto por su código.
 * @param {string} codigo
 * @returns {object|undefined}
 */
function buscarProductoPorCodigo(codigo) {
  return productos.find(p => p.codigo === codigo);
}

/**
 * Verifica si un producto tiene stock disponible.
 * @param {object} producto
 * @returns {boolean}
 */
function tieneStock(producto) {
  return producto && producto.stock > 0;
}

/**
 * Reduce en 1 el stock del producto indicado.
 * @param {object} producto
 */
function actualizarStock(producto) {
  if (producto && producto.stock > 0) {
    producto.stock -= 1;
  }
}

/**
 * Genera la imagen de respaldo (placeholder) si la imagen real no existe.
 * @param {object} producto
 * @returns {string} URL de imagen de respaldo
 */
function imagenRespaldo(producto) {
  const texto = encodeURIComponent(producto.codigo);
  return `https://placehold.co/80x80/6c757d/ffffff?text=${texto}`;
}