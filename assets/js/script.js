// Claves de API para acceder a los datos de Marvel
const apiKey = '4f6e28f8fba60432243f4c006a0345f3'; // Clave pública de la API
const privateKey = '44c2fe2abf27be2f03d2cfa2a90078f17dac5780'; // Clave privada de la API
const baseUrl = 'https://gateway.marvel.com/v1/public/comics'; // URL base de la API

let comicsData = []; // Array para almacenar los datos de los cómics
let displayedComics = 0; // Contador de cómics mostrados
const comicsPerPage = 10; // Mostrar 10 cómics por página

// Función asíncrona para obtener los cómics de la API
async function fetchComics() {
    const comicsList = document.getElementById('comics-list');
    const loadingStatus = document.getElementById('loading-status');
    const loadingSpinner = document.getElementById('loading-spinner');
    const loadingText = document.getElementById('loading-text');

    comicsList.innerHTML = ''; // Limpiar la lista de cómics
    comicsData = []; // Reiniciar los datos de cómics
    displayedComics = 0; // Reiniciar el contador de cómics mostrados

    loadingStatus.className = 'loading'; // Cambiar el estado de carga
    loadingText.textContent = 'Cargando...'; // Mensaje de carga
    loadingStatus.style.display = 'block'; // Mostrar el estado de carga
    loadingSpinner.style.display = 'block'; // Mostrar el spinner de carga

    try {
        const ts = Date.now().toString(); // Timestamp actual
        const hash = generateHash(ts); // Generar hash para la autenticación
        await loadComics(ts, hash); // Cargar los cómics
        await waitForImagesToLoad(); // Esperar a que se carguen las imágenes
        
        // Estado de éxito
        loadingText.textContent = 'Carga completada.'; // Mensaje de éxito
        loadingStatus.className = 'resolved'; // Cambiar a estado resuelto
    } catch (error) {
        // Estado de error
        showErrorMessage(error.message); // Mostrar mensaje de error
        loadingStatus.className = 'error'; // Cambiar a estado de error
    } finally {
        // Ocultar el spinner después de un breve retraso
        setTimeout(() => {
            loadingStatus.style.display = 'none'; // Ocultar estado de carga
            loadingSpinner.style.display = 'none'; // Asegurarse de ocultar el spinner
        }, 500);
        
        sortComics(); // Ordenar después de cargar y procesar los cómics
        loadInitialComics(); // Cargar los primeros cómics después de ordenar
    }
}

// Función asíncrona para cargar los cómics desde la API
async function loadComics(ts, hash) {
    let offset = 0; // Desplazamiento para paginación
    const limit = 100; // Límite de cómics por solicitud
    let totalComics = 0; // Total de cómics disponibles

    do {
        const url = `${baseUrl}?apikey=${apiKey}&ts=${ts}&hash=${hash}&offset=${offset}&limit=${limit}`; // URL de la API
        const response = await fetch(url); // Hacer la solicitud a la API
        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status} ${response.statusText}`); // Manejo de errores
        }
        const data = await response.json(); // Convertir la respuesta a JSON
        totalComics = data.data.total; // Obtener el total de cómics
        comicsData.push(...data.data.results); // Agregar los resultados a comicsData
        offset += limit; // Incrementar el desplazamiento
    } while (offset < totalComics && comicsData.length < 1000); // Continuar hasta que se obtengan todos los cómics o se alcance el límite

    return totalComics; // Retornar el total de cómics
}

// Función para eliminar cómics duplicados
function removeDuplicateComics() {
    const unique = new Map(); // Usar un Map para almacenar cómics únicos
    comicsData.forEach(comic => {
        const key = comic.id; // Usar el ID del cómic como clave única
        if (!unique.has(key)) {
            unique.set(key, comic); // Agregar cómic único al Map
        }
    });
    comicsData = Array.from(unique.values()); // Convertir el Map de vuelta a un array
}

// Función para cargar los cómics iniciales
function loadInitialComics() {
    displayedComics = 0; // Reinicia el contador de cómics mostrados
    const comicsList = document.getElementById('comics-list');
    comicsList.innerHTML = ''; // Limpiar la lista antes de mostrar los cómics
    loadMoreComics(); // Llama a loadMoreComics para mostrar los primeros cómics
}

// Función para cargar más cómics
function loadMoreComics() {
    const comicsList = document.getElementById('comics-list');
    let comicsToDisplay = comicsData.slice(displayedComics, displayedComics + comicsPerPage); // Obtener los cómics a mostrar
    let displayedCount = 0; // Contador de cómics mostrados en esta carga

    if (comicsToDisplay.length === 0) {
        comicsList.innerHTML = '<p>No hay más cómics disponibles.</p>'; // Mensaje si no hay más cómics
        document.getElementById('load-more').style.display = 'none'; // Ocultar botón de cargar más
        return;
    }

    for (let i = 0; i < comicsToDisplay.length; i++) {
        const comic = comicsToDisplay[i];
        const imagePath = comic.thumbnail.path; // Ruta de la imagen del cómic

        const comicItem = document.createElement('div'); // Crear un nuevo elemento para el cómic
        comicItem.className = 'comic-item'; // Asignar clase

        const imageExtension = comic.thumbnail.extension; // Obtener la extensión de la imagen
        const fullImageUrl = `${imagePath}/portrait_xlarge.${imageExtension}`; // URL completa de la imagen

        const onsaleDateObj = comic.dates.find(d => d.type === 'onsaleDate'); // Obtener la fecha de venta
        const onsaleYear = onsaleDateObj ? new Date(onsaleDateObj.date).getFullYear() : 'Año desconocido'; // Obtener el año de venta

        comicItem.innerHTML = `
            <h2>${comic.title}</h2>
            <p><strong>Número:</strong> ${comic.issueNumber || 'N/A'}</p>
            <p><strong>Año:</strong> ${onsaleYear}</p>
        `; // Contenido HTML del cómic

        const img = new Image(); // Crear un nuevo objeto de imagen
        img.src = fullImageUrl; // Asignar la URL de la imagen
        img.alt = `Portada del cómic ${comic.title}`; // Texto alternativo
        img.onerror = () => {
            comicItem.style.display = 'none'; // Ocultar el cómic si la imagen falla
        };

        img.onload = () => {
            comicItem.appendChild(img); // Agregar la imagen al elemento del cómic solo si se carga correctamente
            comicsList.appendChild(comicItem); // Agregar el cómic a la lista
            displayedCount++; // Incrementar el contador de cómics mostrados
        };

        // Agregar evento de clic para redirigir a la página de detalles
        comicItem.onclick = () => {
            localStorage.setItem('comicId', comic.id); // Guardar el ID del cómic en localStorage
            window.location.href = 'post.html'; // Redirigir a la página de detalles del cómic
        };

        // Solo se agrega el cómic si la imagen se carga correctamente
        if (displayedCount < comicsPerPage) {
            comicsList.appendChild(comicItem); // Agregar el cómic a la lista
        }

        if (displayedCount >= comicsPerPage) {
            break; // Salir si se han mostrado suficientes cómics
        }
    }

    displayedComics += displayedCount; // Actualizar el contador de cómics mostrados
    document.getElementById('load-more').style.display = displayedComics < comicsData.length ? 'block' : 'none'; // Mostrar u ocultar el botón de cargar más
}

// Función para ordenar los cómics
function sortComics() {
    const sortBy = document.getElementById('sort').value; // Obtener el criterio de ordenación
    const direction = document.getElementById('direction')?.value || 'asc'; // Obtener la dirección de ordenación

    comicsData.sort((a, b) => {
        let valueA, valueB;

        if (sortBy === 'title') {
            valueA = a.title || ''; // Obtener el título del cómic A
            valueB = b.title || ''; // Obtener el título del cómic B
            return direction === 'asc'
                ? valueA.localeCompare(valueB) // Ordenar ascendente
                : valueB.localeCompare(valueA); // Ordenar descendente
        }

        if (sortBy === 'issueNumber') {
            valueA = a.issueNumber || 0; // Obtener el número del cómic A
            valueB = b.issueNumber || 0; // Obtener el número del cómic B
            return direction === 'asc'
                ? valueA - valueB // Ordenar ascendente
                : valueB - valueA; // Ordenar descendente
        }

        if (sortBy === 'date') {
            const dateA = new Date(a.dates.find(d => d.type === 'onsaleDate')?.date || 0); // Obtener la fecha de venta del cómic A
            const dateB = new Date(b.dates.find(d => d.type === 'onsaleDate')?.date || 0); // Obtener la fecha de venta del cómic B
            return direction === 'asc'
                ? dateA - dateB // Ordenar ascendente
                : dateB - dateA; // Ordenar descendente
        }

        return 0; // Sin orden
    });

    // No reiniciamos displayedComics aquí, para que "Cargar más" siga funcionando correctamente
}

// Función para generar un hash para la autenticación
function generateHash(ts) {
    return CryptoJS.MD5(ts + privateKey + apiKey).toString(); // Generar hash usando CryptoJS
}

// Función para mostrar un mensaje de error
function showErrorMessage(errorMessage) {
    const loadingStatus = document.getElementById('loading-status');
    loadingStatus.style.display = 'none'; // Ocultar estado de carga

    const errorMessageDiv = document.getElementById('error-message');
    if (errorMessageDiv) {
        errorMessageDiv.style.display = 'block'; // Mostrar el mensaje de error
        errorMessageDiv.innerHTML = `
            <img src="assets/images/CapitanAmerica.png" alt="Error en la carga" />
            <p>Perdón, pero ha ocurrido un error en la página. Por favor, disculpe las molestias. Estamos trabajando para solucionarlo en breve.</p>
            <p>Error: ${errorMessage}</p>
        `;
    }
}

// Función para esperar a que se carguen las imágenes
function waitForImagesToLoad() {
    const comicsList = document.getElementById('comics-list');
    const images = comicsList.querySelectorAll('img'); // Obtener todas las imágenes
    const promises = []; // Array para almacenar promesas

    images.forEach(img => {
        if (img.complete) return; // Si la imagen ya está cargada, continuar
        promises.push(new Promise(resolve => {
            img.onload = img.onerror = () => resolve(); // Resolver la promesa cuando la imagen se carga o falla
        }));
    });

    return Promise.all(promises); // Retornar una promesa que se resuelve cuando todas las imágenes se han cargado
}

// Eventos
document.getElementById('load-more').addEventListener('click', () => {
    loadMoreComics(); // Cargar más cómics al hacer clic en el botón
});

document.getElementById('sort').addEventListener('change', () => {
    sortComics(); // Ordenar cómics al cambiar el criterio de ordenación
    loadInitialComics(); // Recargar los primeros cómics después de ordenar
});

document.getElementById('direction')?.addEventListener('change', () => {
    sortComics(); // Ordenar cómics al cambiar la dirección de ordenación
    loadInitialComics(); // Recargar los primeros cómics después de ordenar
});

// Evento de búsqueda
document.getElementById('search').addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase(); // Obtener el término de búsqueda

    if (searchTerm === '') {
        // Si no hay término de búsqueda, recargar los cómics iniciales
        comicsData = []; // Reiniciar los datos de cómics
        displayedComics = 0; // Reiniciar el contador de cómics mostrados
        fetchComics(); // Llamar a la función para obtener los cómics nuevamente
    } else {
        const filteredComics = comicsData.filter(comic => comic.title.toLowerCase().includes(searchTerm)); // Filtrar cómics por título
        loadFilteredComics(filteredComics); // Cargar los cómics filtrados
    }
});

// Función para cargar cómics filtrados
function loadFilteredComics(filteredComics) {
    const comicsList = document.getElementById('comics-list');
    comicsList.innerHTML = ''; // Limpiar la lista antes de mostrar los cómics
    comicsData = filteredComics; // Actualizar los datos de cómics a los filtrados
    displayedComics = 0; // Reiniciar el contador de cómics mostrados
    loadMoreComics(); // Cargar los cómics filtrados
}

// Carga inicial
if (document.getElementById('comics-list')) {
    fetchComics(); // Llamar a la función para obtener los cómics al cargar la página
}
