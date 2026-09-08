import os
import re
import tkinter as tk
from tkinter import filedialog, messagebox

# ==============================================================================
# CONFIGURACIÓN DE LA HOJA DE ESTILOS DE DESTINO
# ==============================================================================
NUEVA_HOJA_ESTILOS = r"H:\LexDigital\Recursos\AUTOMATIZAR INDESIGN\proyecto-lexdigital_modular\estilos\idGeneratedStyles.css"

# ==============================================================================
# PROCESAMIENTO Y REEMPLAZO DE DEPENDENCIAS CSS
# ==============================================================================
def procesar_archivos(lista_archivos, ruta_css):
    ruta_normalizada = ruta_css.replace("\\", "/")
    if not ruta_normalizada.startswith("file:///"):
        ruta_file_uri = f"file:///{ruta_normalizada}"
    else:
        ruta_file_uri = ruta_normalizada

    nuevo_link = f'<link href="{ruta_file_uri}" rel="stylesheet" type="text/css" />'
    
    # Patrón Regex para capturar cualquier referencia previa a hojas CSS en el <head>
    patron_link = re.compile(
        r'<link\b[^>]*href=["\'][^"\']*\.css["\'][^>]*>',
        re.IGNORECASE
    )

    archivos_modificados = 0
    total_reemplazos = 0

    for ruta_archivo in lista_archivos:
        try:
            with open(ruta_archivo, "r", encoding="utf-8") as f:
                contenido = f.read()

            if patron_link.search(contenido):
                # Reemplazar la primera coincidencia del CSS principal
                contenido_nuevo, conteo = patron_link.subn(nuevo_link, contenido, count=1)
                with open(ruta_archivo, "w", encoding="utf-8") as f:
                    f.write(contenido_nuevo)

                archivos_modificados += 1
                total_reemplazos += conteo
                print(f"[OK] Modificado: {ruta_archivo}")
        except Exception as e:
            print(f"[ERROR] No se pudo procesar {ruta_archivo}: {e}")

    return archivos_modificados, total_reemplazos, ruta_file_uri

# ==============================================================================
# INTERFAZ GRÁFICA DE USUARIO (SELECCIÓN)
# ==============================================================================
def seleccionar_archivo_individual(ventana):
    ventana.destroy()
    ruta_archivo = filedialog.askopenfilename(
        title="Selecciona el archivo HTML a actualizar",
        filetypes=[("Archivos HTML", "*.html;*.xhtml;*.htm"), ("Todos los archivos", "*.*")]
    )
    if ruta_archivo:
        ejecutar_proceso([ruta_archivo])

def seleccionar_carpeta_completa(ventana):
    ventana.destroy()
    carpeta = filedialog.askdirectory(
        title="Selecciona la carpeta exportada por InDesign"
    )
    if carpeta:
        archivos = []
        for root, dirs, files in os.walk(carpeta):
            for file in files:
                if file.lower().endswith((".html", ".xhtml", ".htm")):
                    archivos.append(os.path.join(root, file))
        ejecutar_proceso(archivos)

def ejecutar_proceso(archivos):
    if not archivos:
        messagebox.showwarning("Aviso", "No se seleccionaron archivos HTML para procesar.")
        return

    modificados, total, uri = procesar_archivos(archivos, NUEVA_HOJA_ESTILOS)

    mensaje = (
        f"Proceso finalizado con éxito.\n\n"
        f"• Archivos HTML modificados: {modificados} de {len(archivos)}\n"
        f"• Vínculos CSS actualizados: {total}\n"
        f"• CSS asignado: {uri}"
    )
    print(mensaje)
    messagebox.showinfo("LexDigital - Resultado", mensaje)

def main():
    root = tk.Tk()
    root.title("LexDigital - Asignar idGeneratedStyles.css")
    root.resizable(False, False)
    root.geometry("430x180")

    # Centrar la ventana en pantalla
    root.eval('tk::PlaceWindow . center')

    lbl_info = tk.Label(
        root,
        text="¿Cómo deseas aplicar idGeneratedStyles.css?",
        font=("Segoe UI", 10, "bold"),
        pady=15
    )
    lbl_info.pack()

    btn_frame = tk.Frame(root)
    btn_frame.pack(pady=10)

    btn_archivo = tk.Button(
        btn_frame,
        text="📄 Un solo archivo HTML",
        width=22,
        height=2,
        command=lambda: seleccionar_archivo_individual(root)
    )
    btn_archivo.grid(row=0, column=0, padx=6)

    btn_carpeta = tk.Button(
        btn_frame,
        text="📁 Carpeta completa",
        width=22,
        height=2,
        command=lambda: seleccionar_carpeta_completa(root)
    )
    btn_carpeta.grid(row=0, column=1, padx=6)

    root.mainloop()

if __name__ == "__main__":
    main()