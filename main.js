document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.getElementById('juris-search');
    
    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            // Evitamos que la página se recargue al enviar el formulario
            event.preventDefault();
            
            const query = searchInput.value.trim();
            
            if (query.length >= 3) {
                console.log(`Buscando jurisprudencia para: "${query}"`);
                alert(`Simulación: Buscando resultados para "${query}"...`);
                // Aquí iría la lógica real para filtrar las Cards
            } else {
                console.warn('Advertencia: La búsqueda requiere al menos 3 caracteres.');
                alert('Por favor, ingresa al menos 3 caracteres para buscar.');
            }
        });
    }
});
