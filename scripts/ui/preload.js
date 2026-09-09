const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lexdigital', {
    listarDocumentos: () => ipcRenderer.invoke('listar-documentos'),
    procesarDocumento: (documento) => ipcRenderer.invoke('procesar-documento', documento)
});
