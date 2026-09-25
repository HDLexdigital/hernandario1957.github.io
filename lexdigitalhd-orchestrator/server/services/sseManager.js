// server/services/sseManager.js
let clients = [];

// Función para registrar un nuevo cliente (la ventana de Astro)
function addClient(req, res) {
    // Configurar las cabeceras HTTP obligatorias para SSE
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    console.log(`[SSE] Cliente UI conectado: ${clientId}`);

    // Limpiar el cliente si cierra la aplicación/pestaña
    req.on('close', () => {
        console.log(`[SSE] Cliente UI desconectado: ${clientId}`);
        clients = clients.filter(client => client.id !== clientId);
    });
}

// Función para enviar mensajes a todos los clientes (la terminal visual)
function broadcast(message, type = 'info') {
    const payload = JSON.stringify({
        type, 
        message, 
        timestamp: new Date().toISOString()
    });
    // El formato de SSE exige que empiece con "data: " y termine con "\n\n"
    clients.forEach(client => client.res.write(`data: ${payload}\n\n`));
}

module.exports = { addClient, broadcast };