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
        width: 800,
        height: 600,
        backgroundColor: '#f6f5f4',
        autoHideMenuBar: true,
        title: 'LexDigitalHD - Procesar documento',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('listar-documentos', () => listarDocumentos());

ipcMain.handle('procesar-documento', async (event, documento) => {
    const { execSync } = require('child_process');
    const ruta = path.join(PUBLICACIONES, documento);
    const archivos = fs.readdirSync(ruta);
    const jsonFile = archivos.find(a => a.endsWith('.json'));

    if (!jsonFile) {
        return { ok: false, mensaje: 'No se encontró JSON para procesar.', log: '' };
    }

    let log = '';

    const ejecutar = (comando, descripcion) => {
        log += '\n▶ ' + descripcion + '\n';
        try {
            const salida = execSync(comando, { cwd: RAIZ, stdio: 'pipe' }).toString();
            log += salida;
            log += '✅ ' + descripcion + ' completado.\n';
        } catch (error) {
            log += error.stdout ? error.stdout.toString() : '';
            log += error.stderr ? error.stderr.toString() : '';
            log += '⚠️ ' + descripcion + ' finalizó con error.\n';
        }
    };

    try {
        fs.copyFileSync(path.join(ruta, jsonFile), path.join(RAIZ, 'tmp-ledm.json'));

        ejecutar('bash cloudflare-pages-build.sh', 'Generando artefactos');
        ejecutar('node scripts/build-integrity-report.js', 'Validando integridad');

        const reporte = path.join(RAIZ, 'public', 'integrity-report.json');
        const estado = fs.existsSync(reporte)
            ? JSON.parse(fs.readFileSync(reporte, 'utf8')).status
            : 'DESCONOCIDO';

        return { ok: true, estado, log };
    } catch (error) {
        return { ok: false, mensaje: error.message, log };
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
