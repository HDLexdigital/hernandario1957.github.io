# ============================================================
# LexDigital - Migracion UXP + Pipeline
# ============================================================

$ErrorActionPreference = "Stop"

Clear-Host

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       LEXDIGITAL - MIGRACION UXP + PIPELINE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# 1. Solicitar ruta de SRC
# ============================================================

Write-Host "Indica la ruta COMPLETA de la carpeta src actual." -ForegroundColor Yellow
Write-Host ""
Write-Host "Ejemplo:" -ForegroundColor DarkGray
Write-Host "H:\LexDigital\Recursos\AUTOMATIZAR INDESIGN\proyecto-lexdigital\_modular\src" -ForegroundColor DarkGray
Write-Host ""

$RutaSrc = Read-Host "Ruta de src"

$RutaSrc = $RutaSrc.Trim()
$RutaSrc = $RutaSrc.Trim('"')

Write-Host ""

# ============================================================
# 2. Validar SRC
# ============================================================

if (-not (Test-Path -LiteralPath $RutaSrc -PathType Container)) {

    Write-Host "ERROR: La carpeta src no existe." -ForegroundColor Red
    Write-Host ""
    Write-Host $RutaSrc -ForegroundColor Red
    Write-Host ""

    exit 1
}

$RutaSrc = (Resolve-Path -LiteralPath $RutaSrc).Path

Write-Host "SRC encontrada:" -ForegroundColor Green
Write-Host $RutaSrc -ForegroundColor White
Write-Host ""

# ============================================================
# 3. Definir rutas
# ============================================================

$ProyectoRaiz = Split-Path -Parent $RutaSrc

$Pipeline = Join-Path $ProyectoRaiz "LexDigital-Pipeline"
$Core = Join-Path $Pipeline "core"

$Plugin = Join-Path $ProyectoRaiz "LexDigital-UXP-Plugin"
$PluginApi = Join-Path $Plugin "api"

Write-Host "Proyecto raiz:" -ForegroundColor Cyan
Write-Host $ProyectoRaiz
Write-Host ""

# ============================================================
# 4. Mostrar operacion
# ============================================================

Write-Host "SE REALIZARA:" -ForegroundColor Yellow
Write-Host ""

Write-Host "SRC original:" -ForegroundColor White
Write-Host $RutaSrc
Write-Host ""

Write-Host "Copia del SRC:" -ForegroundColor White
Write-Host $Core
Write-Host ""

Write-Host "La SRC original NO sera modificada." -ForegroundColor Green
Write-Host ""

$Confirmacion = Read-Host "¿Continuar? (S/N)"

if ($Confirmacion -notmatch "^[Ss]$") {

    Write-Host ""
    Write-Host "Operacion cancelada." -ForegroundColor Yellow

    exit 0
}

# ============================================================
# 5. Crear directorios
# ============================================================

Write-Host ""
Write-Host "[1/7] Creando directorios..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path $Pipeline -Force | Out-Null
New-Item -ItemType Directory -Path $Core -Force | Out-Null

New-Item -ItemType Directory -Path $Plugin -Force | Out-Null
New-Item -ItemType Directory -Path $PluginApi -Force | Out-Null

Write-Host "      OK" -ForegroundColor Green

# ============================================================
# 6. Comprobar CORE
# ============================================================

$ContenidoCore = @(Get-ChildItem -LiteralPath $Core -Force -ErrorAction SilentlyContinue)

if ($ContenidoCore.Count -gt 0) {

    Write-Host ""
    Write-Host "ADVERTENCIA:" -ForegroundColor Yellow
    Write-Host "La carpeta core ya contiene archivos." -ForegroundColor Yellow
    Write-Host ""

    $Reemplazar = Read-Host "¿Reemplazar contenido de core? (S/N)"

    if ($Reemplazar -notmatch "^[Ss]$") {

        Write-Host ""
        Write-Host "Operacion cancelada." -ForegroundColor Yellow

        exit 0
    }

    Write-Host ""
    Write-Host "Eliminando contenido anterior de core..." -ForegroundColor Yellow

    Get-ChildItem -LiteralPath $Core -Force |
        Remove-Item -Recurse -Force

    Write-Host "      OK" -ForegroundColor Green
}

# ============================================================
# 7. Copiar SRC -> CORE
# ============================================================

Write-Host ""
Write-Host "[2/7] Copiando SRC a core..." -ForegroundColor Yellow

Get-ChildItem -LiteralPath $RutaSrc -Force |
    Copy-Item -Destination $Core -Recurse -Force

Write-Host "      Copia completada." -ForegroundColor Green

# ============================================================
# 8. Crear package.json
# ============================================================

Write-Host ""
Write-Host "[3/7] Creando package.json..." -ForegroundColor Yellow

$PackageJson = Join-Path $Pipeline "package.json"

$PackageLineas = @(
    "{",
    '    "name": "lexdigital-pipeline",',
    '    "version": "1.0.0",',
    '    "description": "Backend WebSocket para LexDigital",',
    '    "main": "server.js",',
    '    "scripts": {',
    '        "start": "node server.js"',
    "    },",
    '    "dependencies": {',
    '        "ws": "^8.18.0"',
    "    }",
    "}"
)

Set-Content `
    -LiteralPath $PackageJson `
    -Value $PackageLineas `
    -Encoding UTF8

Write-Host "      OK" -ForegroundColor Green

# ============================================================
# 9. Crear config.json
# ============================================================

Write-Host ""
Write-Host "[4/7] Creando config.json..." -ForegroundColor Yellow

$ConfigJson = Join-Path $Pipeline "config.json"

$ConfigLineas = @(
    "{",
    '    "host": "127.0.0.1",',
    '    "port": 8765,',
    '    "protocol": "ws"',
    "}"
)

Set-Content `
    -LiteralPath $ConfigJson `
    -Value $ConfigLineas `
    -Encoding UTF8

Write-Host "      OK" -ForegroundColor Green

# ============================================================
# 10. Crear cliente WebSocket
# ============================================================

Write-Host ""
Write-Host "[5/7] Creando cliente WebSocket..." -ForegroundColor Yellow

$ClientJs = Join-Path $PluginApi "lexdigitalClient.js"

$ClientLineas = @(
    'const config = require("../config.json");',
    "",
    "class LexDigitalClient {",
    "",
    "    constructor() {",
    "        this.socket = null;",
    "        this.connected = false;",
    "    }",
    "",
    "    connect() {",
    "",
    "        return new Promise((resolve, reject) => {",
    "",
    '            const url = `${config.protocol}://${config.host}:${config.port}`;',
    "",
    "            this.socket = new WebSocket(url);",
    "",
    "            this.socket.onopen = () => {",
    "                this.connected = true;",
    "                console.log(`[LexDigital] Conectado a ${url}`);",
    "                resolve();",
    "            };",
    "",
    "            this.socket.onerror = (error) => {",
    '                console.error("[LexDigital] Error WebSocket:", error);',
    "                reject(error);",
    "            };",
    "",
    "            this.socket.onclose = () => {",
    "                this.connected = false;",
    '                console.log("[LexDigital] Conexion cerrada.");',
    "            };",
    "        });",
    "    }",
    "",
    "    disconnect() {",
    "        if (this.socket) {",
    "            this.socket.close();",
    "            this.socket = null;",
    "            this.connected = false;",
    "        }",
    "    }",
    "",
    "    send(request) {",
    "",
    "        if (!this.socket || !this.connected) {",
    '            throw new Error("LexDigital Pipeline no esta conectado.");',
    "        }",
    "",
    "        this.socket.send(JSON.stringify(request));",
    "    }",
    "}",
    "",
    "module.exports = LexDigitalClient;"
)

Set-Content `
    -LiteralPath $ClientJs `
    -Value $ClientLineas `
    -Encoding UTF8

Write-Host "      OK" -ForegroundColor Green

# ============================================================
# 11. Crear server.js
# ============================================================

Write-Host ""
Write-Host "[6/7] Creando server.js..." -ForegroundColor Yellow

$ServerJs = Join-Path $Pipeline "server.js"

$ServerLineas = @(
    'const WebSocket = require("ws");',
    "",
    'const config = require("./config.json");',
    "",
    "const HOST = config.host;",
    "const PORT = config.port;",
    "",
    "const servidor = new WebSocket.Server({",
    "    host: HOST,",
    "    port: PORT",
    "});",
    "",
    'console.log("");',
    'console.log("==========================================");',
    'console.log("       LexDigital Pipeline");',
    'console.log("==========================================");',
    'console.log("");',
    'console.log(`Servidor WebSocket: ws://${HOST}:${PORT}`);',
    'console.log("");',
    "",
    'servidor.on("connection", (socket) => {',
    "",
    '    console.log("Cliente UXP conectado.");',
    "",
    "    socket.send(",
    "        JSON.stringify({",
    '            type: "connection",',
    '            status: "connected",',
    '            message: "LexDigital Pipeline conectado"',
    "        })",
    "    );",
    "",
    '    socket.on("message", async (data) => {',
    "",
    "        try {",
    "",
    "            const request = JSON.parse(data.toString());",
    "",
    '            console.log("Solicitud recibida:");',
    "            console.log(request);",
    "",
    "            socket.send(",
    "                JSON.stringify({",
    '                    type: "response",',
    "                    success: true,",
    '                    message: "Solicitud recibida por LexDigital Pipeline",',
    "                    request: request",
    "                })",
    "            );",
    "",
    "        } catch (error) {",
    "",
    '            console.error("Error procesando solicitud:", error);',
    "",
    "            socket.send(",
    "                JSON.stringify({",
    '                    type: "error",',
    "                    success: false,",
    "                    error: error.message",
    "                })",
    "            );",
    "        }",
    "    });",
    "",
    '    socket.on("close", () => {',
    '        console.log("Cliente UXP desconectado.");',
    "    });",
    "});",
    "",
    'servidor.on("error", (error) => {',
    '    console.error("Error del servidor WebSocket:", error);',
    "});"
)

Set-Content `
    -LiteralPath $ServerJs `
    -Value $ServerLineas `
    -Encoding UTF8

Write-Host "      OK" -ForegroundColor Green

# ============================================================
# 12. Crear config del Plugin
# ============================================================

$PluginConfig = Join-Path $Plugin "config.json"

Set-Content `
    -LiteralPath $PluginConfig `
    -Value $ConfigLineas `
    -Encoding UTF8

# ============================================================
# 13. Crear README
# ============================================================

Write-Host ""
Write-Host "[7/7] Creando README..." -ForegroundColor Yellow

$Readme = Join-Path $Pipeline "README.md"

$ReadmeLineas = @(
    "# LexDigital Pipeline",
    "",
    "Backend WebSocket para LexDigital UXP Plugin.",
    "",
    "## Estructura",
    "",
    "LexDigital-Pipeline/",
    "  package.json",
    "  server.js",
    "  config.json",
    "  core/",
    "",
    "La carpeta core contiene una copia del src original.",
    "El src original se conserva intacto.",
    "",
    "## Instalacion",
    "",
    "npm install",
    "",
    "## Ejecucion",
    "",
    "npm start",
    "",
    "Servidor:",
    "",
    "ws://127.0.0.1:8765"
)

Set-Content `
    -LiteralPath $Readme `
    -Value $ReadmeLineas `
    -Encoding UTF8

Write-Host "      OK" -ForegroundColor Green

# ============================================================
# 14. Resultado
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "             MIGRACION COMPLETADA" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "SRC ORIGINAL:" -ForegroundColor Yellow
Write-Host $RutaSrc
Write-Host ""

Write-Host "PIPELINE:" -ForegroundColor Yellow
Write-Host $Pipeline
Write-Host ""

Write-Host "ESTRUCTURA:" -ForegroundColor Cyan
Write-Host ""
Write-Host "LexDigital-UXP-Plugin/"
Write-Host "  api/"
Write-Host "    lexdigitalClient.js"
Write-Host "  config.json"
Write-Host ""
Write-Host "LexDigital-Pipeline/"
Write-Host "  package.json"
Write-Host "  server.js"
Write-Host "  config.json"
Write-Host "  README.md"
Write-Host "  core/"
Write-Host "    [copia de src]"
Write-Host ""

Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "La carpeta src original NO fue modificada." -ForegroundColor Green
Write-Host ""

Write-Host "NO ejecutes npm install todavia." -ForegroundColor Yellow
Write-Host "Primero comprobaremos la estructura y conectaremos el core." -ForegroundColor Yellow
Write-Host ""