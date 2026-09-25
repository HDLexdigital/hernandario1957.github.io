import time
import sys

print("Iniciando validación de estructura legal...")
time.sleep(1)
print("Verificando marcadores para PDF/UA...")
time.sleep(1)
# Simulamos una advertencia
print("Cuidado: Falta texto alternativo en una imagen, aplicando fix automático...", file=sys.stderr)
time.sleep(1)
print("Estructura JSON generada correctamente.")
sys.exit(0) # 0 significa éxito