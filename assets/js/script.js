const apiKey = '4f6e28f8fba60432243f4c006a0345f3';
const privateKey = '44c2fe2abf27be2f03d2cfa2a90078f17dac5780';
const baseUrl = 'https://gateway.marvel.com/v1/public/comics';

let comicsData = [];
let displayedComics = 0; 
const comicsPerPage = 10; 

async function fetchComics() {
    const comicsList = document.getElementById('comics-list');
    const loadingStatus = document.getElementById('loading-status');
    comicsList.innerHTML = ''; 
    comicsData = [];
    displayedComics = 0;
    loadingStatus.className = 'loading';
    loadingStatus.innerHTML = 'Cargando...';
    loadingStatus.style.display = 'block';

    try {
        const ts = Date.now().toString();
        const hash = generateHash(ts);
        let totalComics = await loadComics(ts, hash);
        sortComics();
        loadingStatus.className = 'resolved';
        loadingStatus.innerHTML = 'Carga completada.';
        
        // Llamar a la función para cargar imágenes después de que se complete la carga
        loadImagesForResolvedOrRejected();
        
    } catch (error) {
        showErrorMessage(error.message);
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
    } while (offset < totalComics);

    return totalComics;
}

async function loadPlaceholderComics() {
    const response = await fetch('placeholder.json');
    if (!response.ok) {
        throw new Error(`Error al cargar placeholder: ${response.status} ${response.statusText}`);
    }
    const placeholderData = await response.json();
    comicsData.push(...placeholderData);
    return comicsData.length;
}

function displayInitialComics() {
    const comicsList = document.getElementById('comics-list');
    const comicsToDisplay = comicsData.slice(displayedComics, displayedComics + comicsPerPage);

    comicsToDisplay.forEach(comic => {
        const comicItem = document.createElement('div');
        comicItem.className = 'comic-item';
        const imagePath = comic.thumbnail.path;
        const imageExtension = comic.thumbnail.extension;
        const fullImageUrl = `${imagePath}/portrait_xlarge.${imageExtension}`;
        comicItem.innerHTML = `<h2>${comic.title}</h2><img src="${fullImageUrl}" alt="${comic.title}">`;
        comicItem.onclick = () => {
            localStorage.setItem('comicId', comic.id);
            window.location.href = 'detalle.html';
        };
        comicsList.appendChild(comicItem);
    });

    displayedComics += comicsToDisplay.length;
    document.getElementById('load-more').style.display = displayedComics < comicsData.length ? 'block' : 'none';
}

function loadMoreComics() {
    displayInitialComics();
}

function sortComics() {
    const sortBy = document.getElementById('sort').value;
    if (sortBy === 'title') {
        comicsData.sort((a, b) => a.title.localeCompare(b.title));
    } else {
        comicsData.sort((a, b) => a.issueNumber - b.issueNumber);
    }
    displayedComics = 0;
    document.getElementById('comics-list').innerHTML = '';
    displayInitialComics();
}

function generateHash(ts) {
    return CryptoJS.MD5(ts + privateKey + apiKey).toString();
}

function showErrorMessage(errorMessage) {
    const loadingStatus = document.getElementById('loading-status');
    loadingStatus.style.display = 'none';

    const errorMessageDiv = document.getElementById('error-message');
    if (errorMessageDiv) { // Verifica que el div exista
        errorMessageDiv.style.display = 'block'; 
        errorMessageDiv.innerHTML = `
            <img src="assets/images/CapitanAmerica.png" alt="Error" />
            <p>Perdón, pero ha ocurrido un error en la página. Por favor, disculpe las molestias. Estamos trabajando para solucionarlo en breve.</p>
            <p>Error: ${errorMessage}</p>
        `;
    }
}

function loadImagesForResolvedOrRejected() {
    const comicsList = document.getElementById('comics-list');
    
    comicsData.forEach(comic => {
        if (comic.status === 'resuelto' || comic.status === 'rechazado') {
            const comicItem = document.createElement('div');
            comicItem.className = 'comic-item';
            const imagePath = comic.thumbnail.path;
            const imageExtension = comic.thumbnail.extension;
            const fullImageUrl = `${imagePath}/portrait_xlarge.${imageExtension}`;
            comicItem.innerHTML = `<h2>${comic.title}</h2><img src="${fullImageUrl}" alt="${comic.title}">`;
            comicsList.appendChild(comicItem);
        }
    });
}

// Eventos para cargar más y ordenar
document.getElementById('load-more').addEventListener('click', loadMoreComics);
document.getElementById('sort').addEventListener('change', sortComics);

// Ejecutar carga inicial si el contenedor existe
if (document.getElementById('comics-list')) {
    fetchComics();
}
