// electron/main.js - Electron wrapper for Linux Mint
import { app, BrowserWindow } from 'electron';
import { fork } from 'child_process';
import path from 'path';

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#070c18',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Carga Astro UI servida en localhost o empaquetada
  mainWindow.loadURL('http://localhost:4321');
}

app.whenReady().then(() => {
  // Iniciar servidor Express en subproceso independiente
  serverProcess = fork(path.join(__dirname, '../server/server.js'));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});