const apiKey = '4f6e28f8fba60432243f4c006a0345f3';
const privateKey = '44c2fe2abf27be2f03d2cfa2a90078f17dac5780';
const baseUrl = 'https://gateway.marvel.com/v1/public/comics';
let comicsData = [];
let displayedComics = 0; // Contador de cómics mostrados
const comicsPerPage = 10; // Número de cómics a mostrar por página

async function fetchComics() {
    const comicsList = document.getElementById('comics-list');
    comicsList.innerHTML = ''; // Limpiar el contenido anterior, eliminando el mensaje de carga
    comicsData = []; // Reiniciar el array de cómics

    try {
        const ts = Date.now().toString();
        const hash = generateHash();
        let offset = 0;
        const limit =100; // Número de cómics por solicitud
        let totalComics = 0;

        do {
            const response = await fetch(`${baseUrl}?apikey=${apiKey}&ts=${ts}&hash=${hash}&offset=${offset}&limit=${limit}`);
            if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            totalComics = data.data.total; // Total de cómics disponibles
            comicsData.push(...data.data.results); // Agregar los cómics a la lista
            offset += limit; // Incrementar el offset para la siguiente solicitud
        } while (offset < totalComics); // Continuar hasta que se hayan recuperado todos los cómics

        sortComics(); // Ordenar los cómics al cargar
        displayInitialComics(); // Mostrar los primeros cómics
    } catch (error) {
        const comicsList = document.getElementById('comics-list');
        comicsList.innerHTML = `<p class="error">${error.message}</p>`;
    }
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

        comicItem.innerHTML = `
            <h2>${comic.title}</h2>
            <img src="${fullImageUrl}" alt="${comic.title}">
        `;
        comicItem.onclick = () => {
            localStorage.setItem('comicId', comic.id);
            window.location.href = 'post.html';
        };
        comicsList.appendChild(comicItem);
    });

    displayedComics += comicsToDisplay.length; // Incrementar el contador de cómics mostrados

    // Mostrar el botón "Cargar más" si hay más cómics para mostrar
    const loadMoreButton = document.getElementById('load-more');
    loadMoreButton.style.display = displayedComics < comicsData.length ? 'block' : 'none';
}

function loadMoreComics() {
    const comicsList = document.getElementById('comics-list');
    const comicsToDisplay = comicsData.slice(displayedComics, displayedComics + comicsPerPage);

    comicsToDisplay.forEach(comic => {
        const comicItem = document.createElement('div');
        comicItem.className = 'comic-item';
        const imagePath = comic.thumbnail.path;
        const imageExtension = comic.thumbnail.extension;
        const fullImageUrl = `${imagePath}/portrait_xlarge.${imageExtension}`;

        comicItem.innerHTML = `
            <h2>${comic.title}</h2>
            <img src="${fullImageUrl}" alt="${comic.title}">
        `;
        comicItem.onclick = () => {
            localStorage.setItem('comicId', comic.id);
            window.location.href = 'post.html';
        };
        comicsList.appendChild(comicItem);
    });

    displayedComics += comicsToDisplay.length; // Incrementar el contador de cómics mostrados

    // Mostrar el botón "Cargar más" si hay más cómics para mostrar
    const loadMoreButton = document.getElementById('load-more');
    loadMoreButton.style.display = displayedComics < comicsData.length ? 'block' : 'none';
}

function generateHash() {
    const ts = Date.now().toString();
    return CryptoJS.MD5(ts + privateKey + apiKey).toString();
}

function sortComics() {
    const sortBy = document.getElementById('sort').value;
    if (sortBy === 'title') {
        comicsData.sort((a, b) => a.title.localeCompare(b.title));
    } else {
        comicsData.sort((a, b) => a.issueNumber - b.issueNumber);
    }
    displayInitialComics(); // Mostrar los cómics después de ordenar
}

if (document.getElementById('comics-list')) {
    fetchComics();
} else if (document.getElementById('comic-detail')) {
    fetchComicDetail();
}

async function fetchComicDetail() {
    const comicId = localStorage.getItem('comicId');
    const comicDetail = document.getElementById('comic-detail');

    try {
        const ts = Date.now().toString();
        const hash = generateHash();
        const response = await fetch(`${baseUrl}/${comicId}?apikey=${apiKey}&ts=${ts}&hash=${hash}`);

        if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
        const data = await response.json();
        const comic = data.data.results[0];
        document.getElementById('comic-title').innerText = comic.title;
        comicDetail.innerHTML = `
            <img src="${comic.thumbnail.path}/portrait_xlarge.${comic.thumbnail.extension}" alt="${comic.title}">
            <p>${comic.description || 'No description available.'}</p>
        `;
    } catch (error) {
        comicDetail.innerHTML = `<p class="error">${error.message}</p>`;
    }
}