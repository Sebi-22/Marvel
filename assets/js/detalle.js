const apiKey = '4f6e28f8fba60432243f4c006a0345f3';
const privateKey = '44c2fe2abf27be2f03d2cfa2a90078f17dac5780';
const baseUrl = 'https://gateway.marvel.com/v1/public/comics';

document.addEventListener('DOMContentLoaded', async () => {
    const comicId = localStorage.getItem('comicId');
    if (!comicId) {
        document.getElementById('comic-title').textContent = 'Cómic no encontrado';
        return;
    }

    try {
        const ts = Date.now().toString();
        const hash = generateHash(ts);
        const url = `${baseUrl}/${comicId}?apikey=${apiKey}&ts=${ts}&hash=${hash}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('No se pudo cargar el detalle del cómic.');

        const data = await response.json();
        const comic = data.data.results[0];

        showComicDetails(comic);
    } catch (error) {
        document.getElementById('comic-detail').innerHTML = `<p>Error: ${error.message}</p>`;
    }
});

function generateHash(ts) {
    return CryptoJS.MD5(ts + privateKey + apiKey).toString();
}

function showComicDetails(comic) {
    document.getElementById('comic-title').textContent = comic.title;

    const imageUrl = `${comic.thumbnail.path}.${comic.thumbnail.extension}`;
    const description = comic.description || 'Sin descripción disponible.';
    const price = comic.prices[0]?.price ? `$${comic.prices[0].price}` : 'Precio no disponible';
    const pageCount = comic.pageCount || 'N/D';
    const creators = comic.creators.items.map(c => c.name).join(', ') || 'No listados';

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
    document.getElementById('comic-detail').innerHTML = html;
}
