#!/bin/bash

# Variables de configuración
VM_NAME="Windows11_LexDigital"
WIN_USER="TuUsuarioWindows"
WIN_PASS="TuContraseñaWindows"

# Rutas dentro del entorno de Windows (pueden ser unidades de red mapeadas desde Linux)
INDESIGN_EXE="C:\Program Files\Adobe\Adobe InDesign 2024\InDesign.exe"
JSX_SCRIPT="Z:\LexDigital\scripts\procesar_constitucion.jsx"

echo "Enviando orden a la Máquina Virtual: $VM_NAME..."

# Ejecutar el comando dentro de Windows de forma silenciosa
VBoxManage guestcontrol "$VM_NAME" run \
  --exe "C:\Windows\System32\cmd.exe" \
  --username "$WIN_USER" \
  --password "$WIN_PASS" \
  --wait-stdout \
  -- /c "\"\(INDESIGN_EXE\" \"\)JSX_SCRIPT\""

echo "Comando enviado a InDesign."

# (Después de lanzar VBoxManage en el script anterior...)

FLAG_FILE="/media/sf_LexDigital/temp/indesign_terminado.flag"

echo "Esperando a que InDesign termine la maquetación..."

# Bucle de espera (chequea cada 3 segundos)
while [ ! -f "$FLAG_FILE" ]; do
  sleep 3
done

echo "¡InDesign ha terminado el trabajo!"
# Limpiar el archivo bandera para la próxima vez
rm "$FLAG_FILE"
exit 0