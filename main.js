const infoProductos = {
    "core-tank-vanilla": {
        nombre: "CORE TANK VANILLA",
        precio: "$45.000",
        descripcion: "Nuestra musculosa estrella en color vainilla. Tela premium de alta compresión.",
        imagen: "coretankamarillo.jpg" // Asegurate que el nombre coincida con tu carpeta
    },
    "core-tank-chocolate": {
        nombre: "CORE TANK CHOCOLATE",
        precio: "$45.000",
        descripcion: "Nuestra musculosa estrella en color chocolate. Tela premium de alta compresión.",
        imagen: "coretankmarron.jpg" // Asegurate que el nombre coincida con tu carpeta
    },
    "high-waist-stone": {
        nombre: "HIGH-WAIST LEGGING STONE",
        precio: "$60.000",
        descripcion: "Leggings de tiro alto en color piedra. Costuras reforzadas para máximo confort.",
        imagen: "calzagris.jpg"
    },
    "high-waist-black": {
        nombre: "HIGH-WAIST LEGGING BLACK",
        precio: "$60.000",
        descripcion: "Leggings de tiro alto en color negro. Costuras reforzadas para máximo confort.",
        imagen: "calzanegra.jpg"
    },
    "luna-top-white": {
        nombre: "LUNA TOP WHITE",
        precio: "$40.000",
        descripcion: "El equilibrio perfecto entre soporte y libertad. Tejido rib acanalado de alta elasticidad, diseñado para acompañarte todo el día.",
        imagen: "lunatopblanco.jpg"
    },
    "luna-top-black": {
        nombre: "LUNA TOP BLACK",
        precio: "$40.000",
        descripcion: "El equilibrio perfecto entre soporte y libertad. Tejido rib acanalado de alta elasticidad, diseñado para acompañarte todo el día.",
        imagen: "lunatopnegro.jpg"
    },
    "airlift-cap-chocolate": {
        nombre: "AIRLIFT CAP CHOCOLATE",
        precio: "$25.000",
        descripcion: "Gorra ajustable con logo bordado. El accesorio perfecto para tu post-workout.",
        imagen: "airliftcapmarron.jpg"
    },
    "airlift-cap-vanilla": {
        nombre: "AIRLIFT CAP VANILLA",
        precio: "$25.000",
        descripcion: "Gorra ajustable con logo bordado. El accesorio perfecto para tu post-workout.",
        imagen: "airliftcapcrema.jpg"
    }
}



document.addEventListener("DOMContentLoaded", function() {
    console.log("Sistema de filtrado activo");

    // 1. Capturamos el filtro de la URL
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');

    // 2. Buscamos todos los productos
    const products = document.querySelectorAll('.product-card');

    if (filter && filter !== 'novedades') {
        console.log("Filtrando por:", filter);
        
        products.forEach(product => {
            // Revisamos si el producto tiene la clase
            if (product.classList.contains(filter.trim())) {
                product.style.setProperty('display', 'flex', 'important');
            } else {
                product.style.setProperty('display', 'none', 'important');
            }
        });
    } else {
        console.log("Mostrando todos los productos");
        products.forEach(product => {
            product.style.setProperty('display', 'flex', 'important');
        });
    }
});

document.addEventListener("DOMContentLoaded", function() {
    // 1. Obtener el ID del producto de la URL (ej: ?id=core-tank-vanilla)
    const params = new URLSearchParams(window.location.search);
    const productoID = params.get('id');

    // 2. Si estamos en la página de detalle y tenemos un ID
    if (productoID && infoProductos[productoID]) {
        const datos = infoProductos[productoID];

        // 3. Reemplazar el contenido del HTML con los datos de la "Base de Datos"
        document.querySelector(".product-title").textContent = datos.nombre;
        document.querySelector(".product-price").textContent = datos.precio;
        document.querySelector(".product-description").textContent = datos.descripcion;
        document.querySelector(".product-gallery img").src = datos.imagen;
    }
});