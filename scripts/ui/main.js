const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..', '..');
const PUBLICACIONES = path.join(RAIZ, 'publicaciones');

function listarDocumentos() {
    return fs.readdirSync(PUBLICACIONES)
        .filter(nombre => fs.statSync(path.join(PUBLICACIONES, nombre)).isDirectory());
}

function createWindow() {
    const win = new BrowserWindow({
        width: 860,
        height: 720,
        backgroundColor: '#f6f5f4',
        autoHideMenuBar: true,
        title: 'LexDigitalHD - Pipeline de Compilación',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('listar-documentos', () => listarDocumentos());

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
