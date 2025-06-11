// Claves de API para acceder a los datos de Marvel
const apiKey = '4f6e28f8fba60432243f4c006a0345f3'; // Clave pública de la API
const privateKey = '44c2fe2abf27be2f03d2cfa2a90078f17dac5780'; // Clave privada de la API
const baseUrl = 'https://gateway.marvel.com/v1/public/comics'; // URL base de la API

// Esperar a que el contenido del DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async () => {
    const comicId = localStorage.getItem('comicId'); // Obtener el ID del cómic desde localStorage
    if (!comicId) {
        document.getElementById('comic-title').textContent = 'Cómic no encontrado'; // Mensaje si no se encuentra el cómic
        return; // Salir de la función si no hay ID
    }

    try {
        const ts = Date.now().toString(); // Obtener el timestamp actual
        const hash = generateHash(ts); // Generar hash para la autenticación
        const url = `${baseUrl}/${comicId}?apikey=${apiKey}&ts=${ts}&hash=${hash}`; // Construir la URL para la solicitud
        const response = await fetch(url); // Hacer la solicitud a la API
        if (!response.ok) throw new Error('No se pudo cargar el detalle del cómic.'); // Manejo de errores

        const data = await response.json(); // Convertir la respuesta a JSON
        const comic = data.data.results[0]; // Obtener el primer cómic de los resultados

        showComicDetails(comic); // Mostrar los detalles del cómic
    } catch (error) {
        document.getElementById('comic-detail').innerHTML = `<p>Error: ${error.message}</p>`; // Mostrar mensaje de error
    }
});

// Función para generar un hash para la autenticación
function generateHash(ts) {
    return CryptoJS.MD5(ts + privateKey + apiKey).toString(); // Generar hash usando CryptoJS
}

// Función para mostrar los detalles del cómic
function showComicDetails(comic) {
    document.getElementById('comic-title').textContent = comic.title; // Mostrar el título del cómic

    const imageUrl = `${comic.thumbnail.path}.${comic.thumbnail.extension}`; // URL de la imagen del cómic
    const description = comic.description || 'Sin descripción disponible.'; // Descripción del cómic
    const price = comic.prices[0]?.price ? `$${comic.prices[0].price}` : 'Precio no disponible'; // Precio del cómic
    const pageCount = comic.pageCount || 'N/D'; // Número de páginas del cómic
    const creators = comic.creators.items.map(c => c.name).join(', ') || 'No listados'; // Nombres de los creadores

    // Crear el HTML para mostrar los detalles del cómic
    const html = `
        <section class="comic-info">
            <img src="${imageUrl}" alt="${comic.title}" class="comic-image">
            <div class="comic-meta">
                <p><strong>Descripción:</strong> ${description}</p>
                <p><strong>Páginas:</strong> ${pageCount}</p>
                <p><strong>Precio:</strong> ${price}</p>
                <p><strong>Creadores:</strong> ${creators}</p>
            </div>
        </section>
    `;
    document.getElementById('comic-detail').innerHTML = html; // Insertar el HTML en el contenedor de detalles del cómic
}

// Manejo de reseñas
document.getElementById('submit-review').addEventListener('click', () => {
    const reviewText = document.getElementById('review-text').value; // Obtener el texto de la reseña
    const rating = document.getElementById('rating').value; // Obtener la calificación

    if (reviewText) {
        // Aquí puedes guardar la reseña en un almacenamiento local o enviar a un servidor
        alert(`Reseña enviada: ${reviewText} - Calificación: ${rating} estrellas`); // Mostrar alerta con la reseña y calificación
        document.getElementById('review-text').value = ''; // Limpiar el campo de reseña
    } else {
        alert('Por favor, escribe una reseña antes de enviar.'); // Mensaje si no hay reseña
    }
});
