 const apiKey = '4f6e28f8fba60432243f4c006a0345f3';
        const privateKey = '44c2fe2abf27be2f03d2cfa2a90078f17dac5780';
        const baseUrl = 'https://gateway.marvel.com/v1/public/comics';

        let comicsData = [];
        let displayedComics = 0; 
        const comicsPerPage = 10;

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
                sortComics();
                // Esperar a que todas las imágenes visibles se carguen antes de ocultar spinner
                await waitForImagesToLoad();
                loadingText.textContent = 'Carga completada.';
                // Ocultar spinner y texto después de 1.5 segundos
                setTimeout(() => {
                    loadingStatus.style.display = 'none';
                }, 500);
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
            } while (offset < totalComics && comicsData.length < 1000);

            return totalComics;
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
                comicItem.innerHTML = `<h2>${comic.title}</h2><img src="${fullImageUrl}" alt="Portada del cómic ${comic.title}">`;
                comicItem.onclick = () => {
                    localStorage.setItem('comicId', comic.id);
                    window.location.href = 'post.html';
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
            if (errorMessageDiv) {
                errorMessageDiv.style.display = 'block'; 
                errorMessageDiv.innerHTML = `
                    <img src="assets/images/CapitanAmerica.png" alt="Error en la carga" />
                    <p>Perdón, pero ha ocurrido un error en la página. Por favor, disculpe las molestias. Estamos trabajando para solucionarlo en breve.</p>
                    <p>Error: ${errorMessage}</p>
                `;
            }
        }

        // Espera a que todas las imágenes visibles en #comics-list se carguen
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

        // Eventos para cargar más y ordenar
        document.getElementById('load-more').addEventListener('click', () => {
            displayInitialComics();
        });
        document.getElementById('sort').addEventListener('change', () => {
            sortComics();
        });

        // Ejecutar carga inicial si el contenedor existe
        if (document.getElementById('comics-list')) {
            fetchComics();
        }
