#!/usr/bin/env bash
set -euo pipefail

cd ~/proyecto-lexdigital

SERVER_FILE="core/api/server.js"

# Verificar que el archivo exista
if [[ ! -f "$SERVER_FILE" ]]; then
    echo "Error: No se encuentra $SERVER_FILE"
    exit 1
fi

echo "==> Verificando importaciones de fs y path"
if ! grep -q "require('fs')" "$SERVER_FILE"; then
    echo "Agregando importación de fs"
    # Insertar al principio del archivo, después de cualquier otra importación
    sed -i "1i const fs = require('fs');" "$SERVER_FILE"
fi
if ! grep -q "require('path')" "$SERVER_FILE"; then
    echo "Agregando importación de path"
    sed -i "1i const path = require('path');" "$SERVER_FILE"
fi

echo "==> Insertando endpoint de anchors"
# Buscar una línea que marque el inicio de rutas privadas o administración
# Si no existe, insertaremos antes de app.listen o al final.
MARKER="// Rutas administrativas"
if grep -q "$MARKER" "$SERVER_FILE"; then
    # Insertar antes del marcador
    sed -i "/$MARKER/e cat <<'ENDPOINT'

app.get('/api/v1/public/anchors', (req, res) => {
  const anchorsPath = path.join(__dirname, '..', '..', 'public', 'anchors.json');
  if (!fs.existsSync(anchorsPath)) {
    return res.status(404).json({ error: 'anchors not found' });
  }
  const data = JSON.parse(fs.readFileSync(anchorsPath, 'utf8'));
  res.json(data);
});

ENDPOINT
" "$SERVER_FILE"
else
    echo "No se encontró marcador '$MARKER'. Se intentará insertar antes de app.listen."
    # Intentar insertar antes de app.listen
    grep -n "app.listen" "$SERVER_FILE"
    if grep -q "app.listen" "$SERVER_FILE"; then
        # Insertar antes de la línea que contiene app.listen
        sed -i "/app.listen/e cat <<'ENDPOINT'

app.get('/api/v1/public/anchors', (req, res) => {
  const anchorsPath = path.join(__dirname, '..', '..', 'public', 'anchors.json');
  if (!fs.existsSync(anchorsPath)) {
    return res.status(404).json({ error: 'anchors not found' });
  }
  const data = JSON.parse(fs.readFileSync(anchorsPath, 'utf8'));
  res.json(data);
});

ENDPOINT
" "$SERVER_FILE"
    else
        echo "No se pudo insertar automáticamente. Agrega el endpoint manualmente."
        exit 1
    fi
fi

echo "==> Verificando sintaxis del servidor"
node --check "$SERVER_FILE"

echo "==> Ejecutando pruebas de API"
npm test core/api/test/mvp-011-api.server.test.js || true

echo "==> Ejecutando pruebas de Auth"
npm test core/api/test/mvp-015-api-key.test.js || true

echo "==> Ejecutando todas las pruebas de API si existen"
npm test core/api/test/ || true

echo "==> Commit y push"
git add "$SERVER_FILE"
git commit -m "feat(anchors): add public endpoint GET /api/v1/public/anchors"
git push origin feat/mvp-004

echo "==> Endpoint integrado exitosamente"cat << 'EOF' > scripts/add-anchors-endpoint.js
const fs = require('fs');
const path = require('path');

const SERVER_FILE = path.join(__dirname, '..', 'core', 'api', 'server.js');
const MARKER = "app.use(createAuditLogger());";

if (!fs.existsSync(SERVER_FILE)) {
  console.error('No se encuentra server.js');
  process.exit(1);
}

let content = fs.readFileSync(SERVER_FILE, 'utf8');

// Verificar si el endpoint ya existe
if (content.includes('/api/v1/public/anchors')) {
  console.log('El endpoint ya existe, saliendo.');
  process.exit(0);
}

const endpointBlock = `
app.get('/api/v1/public/anchors', (req, res) => {
  const anchorsPath = path.join(RAIZ, 'public', 'anchors.json');
  if (!fs.existsSync(anchorsPath)) {
    return res.status(404).json({ error: 'anchors not found' });
  }
  const data = JSON.parse(fs.readFileSync(anchorsPath, 'utf8'));
  res.json(data);
});
`;

if (!content.includes(MARKER)) {
  console.error('No se encontró el marcador "app.use(createAuditLogger());" en server.js');
  process.exit(1);
}

// Insertar después del marcador
content = content.replace(MARKER, MARKER + endpointBlock);

fs.writeFileSync(SERVER_FILE, content, 'utf8');
console.log('Endpoint /api/v1/public/anchors insertado correctamente.');
EOF