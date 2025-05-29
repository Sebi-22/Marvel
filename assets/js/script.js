const apiKey = '4f6e28f8fba60432243f4c006a0345f3';
const privateKey = '44c2fe2abf27be2f03d2cfa2a90078f17dac5780';
const baseUrl = 'https://gateway.marvel.com/v1/public/comics';
let comicsData = [];
let displayedComics = 0; // Count of displayed comics
const comicsPerPage = 10; // Comics to display per page

// Fetch cards from Marvel API
async function fetchComics() {
    const comicsList = document.getElementById('comics-list');
    comicsList.innerHTML = ''; // Clear previous content
    comicsData = []; // Reset comics array

    try {
        const ts = Date.now().toString();
        const hash = generateHash();
        let offset = 0;
        const limit = 100; // Number of comics per request
        let totalComics = 0;

        do {
            const response = await fetch(`${baseUrl}?apikey=${apiKey}&ts=${ts}&hash=${hash}&offset=${offset}&limit=${limit}`);
            if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            totalComics = data.data.total;
            comicsData.push(...data.data.results);
            offset += limit;
        } while (offset < totalComics);

        sortComics(); // Sort comics when loaded
        displayInitialComics(); // Show initial comics
    } catch (error) {
        document.getElementById('comics-list').innerHTML = `<p class="error">${error.message}</p>`;
    }
}

// Display comics on the page
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

    displayedComics += comicsToDisplay.length;
    document.getElementById('load-more').style.display = displayedComics < comicsData.length ? 'block' : 'none';
}

// Load more comics
function loadMoreComics() {
    displayInitialComics();
}

// Generate the hash for API access
function generateHash() {
    const ts = Date.now().toString();
    return CryptoJS.MD5(ts + privateKey + apiKey).toString();
}

// Sort comics based on user selection
function sortComics() {
    const sortBy = document.getElementById('sort').value;
    if (sortBy === 'title') {
        comicsData.sort((a, b) => a.title.localeCompare(b.title));
    } else {
        comicsData.sort((a, b) => a.issueNumber - b.issueNumber);
    }
    displayInitialComics();
}

// Fetch comic details when a comic is clicked
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

// Initialize fetch comics on load
if (document.getElementById('comics-list')) {
    fetchComics();
} else if (document.getElementById('comic-detail')) {
    fetchComicDetail();
}
