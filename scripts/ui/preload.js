const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lexdigital', {
    listarDocumentos: () => ipcRenderer.invoke('listar-documentos')
});
