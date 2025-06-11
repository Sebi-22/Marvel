const apiKey = '4f6e28f8fba60432243f4c006a0345f3';
const privateKey = '44c2fe2abf27be2f03d2cfa2a90078f17dac5780';
const baseUrl = 'https://gateway.marvel.com/v1/public/comics';

let comicsData = [];
let displayedComics = 0;
const comicsPerPage = 10; // Mostrar 10 cómics por página

async function fetchComics() {
    const comicsList = document.getElementById('comics-list');
    const loadingStatus = document.getElementById('loading-status');
    const loadingSpinner = document.getElementById('loading-spinner');
    const loadingText = document.getElementById('loading-text');

    comicsList.innerHTML = '';
    comicsData = [];
    displayedComics = 0;

    loadingStatus.className = 'loading';
    loadingText.textContent = 'Cargando...';
    loadingStatus.style.display = 'block';
    loadingSpinner.style.display = 'block';

    try {
        const ts = Date.now().toString();
        const hash = generateHash(ts);
        await loadComics(ts, hash);
        removeDuplicateComics();
        await waitForImagesToLoad();
        loadingText.textContent = 'Carga completada.';
        setTimeout(() => {
            loadingStatus.style.display = 'none';
        }, 500);
    } catch (error) {
        showErrorMessage(error.message);
    } finally {
        sortComics(); // Ordenar después de cargar y procesar los cómics
        loadInitialComics(); // Cargar los primeros cómics después de ordenar
    }
}

async function loadComics(ts, hash) {
    let offset = 0;
    const limit = 100;
    let totalComics = 0;

    do {
        const url = `${baseUrl}?apikey=${apiKey}&ts=${ts}&hash=${hash}&offset=${offset}&limit=${limit}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        totalComics = data.data.total;
        comicsData.push(...data.data.results);
        offset += limit;
    } while (offset < totalComics && comicsData.length < 1000);

    return totalComics;
}

function removeDuplicateComics() {
    const unique = new Map();
    comicsData.forEach(comic => {
        const key = `${comic.title}-${comic.issueNumber}`;
        if (!unique.has(key)) {
            unique.set(key, comic);
        }
    });
    comicsData = Array.from(unique.values());
}

function loadInitialComics() {
    displayedComics = 0; // Reinicia el contador de cómics mostrados
    const comicsList = document.getElementById('comics-list');
    comicsList.innerHTML = ''; // Limpiar la lista antes de mostrar los cómics
    loadMoreComics(); // Llama a loadMoreComics para mostrar los primeros cómics
}

function loadMoreComics() {
    const comicsList = document.getElementById('comics-list');
    let comicsToDisplay = comicsData.slice(displayedComics, displayedComics + comicsPerPage);
    let displayedCount = 0;

    if (comicsToDisplay.length === 0) {
        comicsList.innerHTML = '<p>No hay más cómics disponibles.</p>';
        document.getElementById('load-more').style.display = 'none';
        return;
    }

    for (let i = 0; i < comicsToDisplay.length; i++) {
        const comic = comicsToDisplay[i];
        const imagePath = comic.thumbnail.path;

        const comicItem = document.createElement('div');
        comicItem.className = 'comic-item';

        const imageExtension = comic.thumbnail.extension;
        const fullImageUrl = `${imagePath}/portrait_xlarge.${imageExtension}`;

        const onsaleDateObj = comic.dates.find(d => d.type === 'onsaleDate');
        const onsaleYear = onsaleDateObj ? new Date(onsaleDateObj.date).getFullYear() : 'Año desconocido';

        comicItem.innerHTML = `
            <h2>${comic.title}</h2>
            <p><strong>Número:</strong> ${comic.issueNumber || 'N/A'}</p>
            <p><strong>Año:</strong> ${onsaleYear}</p>
        `;

        const img = new Image();
        img.src = fullImageUrl;
        img.alt = `Portada del cómic ${comic.title}`;
        img.onerror = () => {
            comicItem.style.display = 'none';
        };

        comicItem.appendChild(img);

        comicItem.onclick = () => {
            localStorage.setItem('comicId', comic.id);
            window.location.href = 'post.html';
        };

        comicsList.appendChild(comicItem);
        displayedCount++;

        if (displayedCount >= comicsPerPage) {
            break;
        }
    }

    displayedComics += displayedCount;
    document.getElementById('load-more').style.display = displayedComics < comicsData.length ? 'block' : 'none';
}

function sortComics() {
    const sortBy = document.getElementById('sort').value;
    const direction = document.getElementById('direction')?.value || 'asc';

    comicsData.sort((a, b) => {
        let valueA, valueB;

        if (sortBy === 'title') {
            valueA = a.title || '';
            valueB = b.title || '';
            return direction === 'asc'
                ? valueA.localeCompare(valueB)
                : valueB.localeCompare(valueA);
        }

        if (sortBy === 'issueNumber') {
            valueA = a.issueNumber || 0;
            valueB = b.issueNumber || 0;
            return direction === 'asc'
                ? valueA - valueB
                : valueB - valueA;
        }

        if (sortBy === 'date') {
            const dateA = new Date(a.dates.find(d => d.type === 'onsaleDate')?.date || 0);
            const dateB = new Date(b.dates.find(d => d.type === 'onsaleDate')?.date || 0);
            return direction === 'asc'
                ? dateA - dateB
                : dateB - dateA;
        }

        return 0;
    });

    // No reiniciamos displayedComics aquí, para que "Cargar más" siga funcionando correctamente
}

function generateHash(ts) {
    return CryptoJS.MD5(ts + privateKey + apiKey).toString();
}

function showErrorMessage(errorMessage) {
    const loadingStatus = document.getElementById('loading-status');
    loadingStatus.style.display = 'none';

    const errorMessageDiv = document.getElementById('error-message');
    if (errorMessageDiv) {
        errorMessageDiv.style.display = 'block';
        errorMessageDiv.innerHTML = `
            <img src="assets/images/CapitanAmerica.png" alt="Error en la carga" />
            <p>Perdón, pero ha ocurrido un error en la página. Por favor, disculpe las molestias. Estamos trabajando para solucionarlo en breve.</p>
            <p>Error: ${errorMessage}</p>
        `;
    }
}

function waitForImagesToLoad() {
    const comicsList = document.getElementById('comics-list');
    const images = comicsList.querySelectorAll('img');
    const promises = [];

    images.forEach(img => {
        if (img.complete) return;
        promises.push(new Promise(resolve => {
            img.onload = img.onerror = () => resolve();
        }));
    });

    return Promise.all(promises);
}

// Eventos
document.getElementById('load-more').addEventListener('click', () => {
    loadMoreComics();
});

document.getElementById('sort').addEventListener('change', () => {
    sortComics();
    loadInitialComics(); // Recargar los primeros cómics después de ordenar
});

document.getElementById('direction')?.addEventListener('change', () => {
    sortComics();
    loadInitialComics(); // Recargar los primeros cómics después de ordenar
});

// Evento de búsqueda
document.getElementById('search').addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const filteredComics = comicsData.filter(comic => comic.title.toLowerCase().includes(searchTerm));
    displayedComics = 0; // Reiniciar el contador de cómics mostrados
    loadFilteredComics(filteredComics);
});

function loadFilteredComics(filteredComics) {
    const comicsList = document.getElementById('comics-list');
    comicsList.innerHTML = ''; // Limpiar la lista antes de mostrar los cómics
    comicsData = filteredComics; // Actualizar los datos de cómics a los filtrados
    loadMoreComics(); // Cargar los cómics filtrados
}

// Carga inicial
if (document.getElementById('comics-list')) {
    fetchComics();
}
