#!/bin/bash

# Asegurar que se ejecuta con privilegios de superusuario (sudo)
if [ "$EUID" -ne 0 ]; then
  echo "[-] Este script debe ejecutarse con privilegios de superusuario. Usa: sudo ./install-service.sh"
  exit 1
fi

echo "[+] Iniciando instalación del servicio LexDigitalHD Watchdog..."

# 1. Detectar la ruta real de Node.js en el sistema
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
  echo "[-] Error crítico: No se encontró Node.js en el PATH del sistema."
  exit 1
fi
echo "[+] Node.js detectado en: $NODE_PATH"

# 2. Definir rutas del proyecto y del servicio
PROJECT_DIR="/home/hernan/projects/lexdigitalhd"
SERVICE_SRC="$PROJECT_DIR/server/lexdigitalhd-watchdog.service"
SERVICE_DEST="/etc/systemd/system/lexdigitalhd-watchdog.service"

if [ ! -f "$SERVICE_SRC" ]; then
  echo "[-] No se encontró el archivo de servicio en $SERVICE_SRC"
  exit 1
fi

# 3. Actualizar dinámicamente la ruta de Node.js en el archivo de servicio si es distinta
sed -i "s|ExecStart=.*|ExecStart=$NODE_PATH $PROJECT_DIR/server/index.js|g" "$SERVICE_SRC"

# 4. Copiar el servicio a la ruta del sistema systemd
echo "[+] Copiando configuración a $SERVICE_DEST..."
cp "$SERVICE_SRC" "$SERVICE_DEST"

# 5. Recargar systemd, habilitar e iniciar el servicio
echo "[+] Recargando daemon de systemd..."
systemctl daemon-reload

echo "[+] Habilitando servicio al arranque del sistema..."
systemctl enable lexdigitalhd-watchdog.service

echo "[+] Iniciando servicio lexdigitalhd-watchdog..."
systemctl start lexdigitalhd-watchdog.service

# 6. Comprobar estado final
echo "[+] Verificando estado del servicio:"
systemctl status lexdigitalhd-watchdog.service --no-pager
