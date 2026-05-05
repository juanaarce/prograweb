// Catálogo de productos LYNKS
// Migrado desde main.js — fuente única de verdad para todo el front-end.

export const products = {
  "core-tank-vanilla": {
    id: "core-tank-vanilla",
    nombre: "CORE TANK VANILLA",
    precio: "$45.000",
    descripcion:
      "Nuestra musculosa estrella en color vainilla. Tela premium de alta compresión.",
    imagen: "/coretankamarillo.jpg",
    categoria: "tops",
  },
  "core-tank-chocolate": {
    id: "core-tank-chocolate",
    nombre: "CORE TANK CHOCOLATE",
    precio: "$45.000",
    descripcion:
      "Nuestra musculosa estrella en color chocolate. Tela premium de alta compresión.",
    imagen: "/coretankmarron.jpg",
    categoria: "tops",
  },
  "high-waist-stone": {
    id: "high-waist-stone",
    nombre: "HIGH-WAIST LEGGING STONE",
    precio: "$60.000",
    descripcion:
      "Leggings de tiro alto en color piedra. Costuras reforzadas para máximo confort.",
    imagen: "/calzagris.jpg",
    categoria: "bottoms",
  },
  "high-waist-black": {
    id: "high-waist-black",
    nombre: "HIGH-WAIST LEGGING BLACK",
    precio: "$60.000",
    descripcion:
      "Leggings de tiro alto en color negro. Costuras reforzadas para máximo confort.",
    imagen: "/calzanegra.jpg",
    categoria: "bottoms",
  },
  "luna-top-white": {
    id: "luna-top-white",
    nombre: "LUNA TOP WHITE",
    precio: "$40.000",
    descripcion:
      "El equilibrio perfecto entre soporte y libertad. Tejido rib acanalado de alta elasticidad, diseñado para acompañarte todo el día.",
    imagen: "/lunatopblanco.jpg",
    categoria: "tops",
  },
  "luna-top-black": {
    id: "luna-top-black",
    nombre: "LUNA TOP BLACK",
    precio: "$40.000",
    descripcion:
      "El equilibrio perfecto entre soporte y libertad. Tejido rib acanalado de alta elasticidad, diseñado para acompañarte todo el día.",
    imagen: "/lunatopnegro.jpg",
    categoria: "tops",
  },
  "airlift-cap-chocolate": {
    id: "airlift-cap-chocolate",
    nombre: "AIRLIFT CAP CHOCOLATE",
    precio: "$25.000",
    descripcion:
      "Gorra ajustable con logo bordado. El accesorio perfecto para tu post-workout.",
    imagen: "/airliftcapmarron.jpg",
    categoria: "gorros",
  },
  "airlift-cap-vanilla": {
    id: "airlift-cap-vanilla",
    nombre: "AIRLIFT CAP VANILLA",
    precio: "$25.000",
    descripcion:
      "Gorra ajustable con logo bordado. El accesorio perfecto para tu post-workout.",
    imagen: "/airliftcapcrema.jpg",
    categoria: "gorros",
  },
};

// Helpers
export const getProductsArray = () => Object.values(products);

export const getProductById = (id) => products[id] || null;

export const getProductsByCategory = (categoria) => {
  if (!categoria || categoria === "novedades") return getProductsArray();
  return getProductsArray().filter((p) => p.categoria === categoria);
};

// Lista de categorías válidas para la ruta dinámica
export const validCategories = ["tops", "bottoms", "gorros", "novedades"];
