# Guía Técnica de Arquitectura e Infraestructura — LexDigitalHD

Esta guía detalla la arquitectura técnica robusta, escalable y optimizada para soportar un alto volumen de usuarios, manteniendo la simplicidad operativa mediante un ecosistema unificado en Cloudflare y Google Cloud.

## 1. Arquitectura General del Sistema
* **Frontend (Interfaz de Usuario):** Desarrollado con el framework **Astro** y desplegado globalmente a través de **Cloudflare Pages** para garantizar velocidad de carga instantánea, optimización SEO y distribución en el *edge*.
* **Backend y Lógica de Negocio:** Implementado en **Google Cloud Run** (arquitectura *serverless* basada en contenedores Docker sin estado o *stateless*), asegurando escalabilidad automática ante picos masivos de tráfico.
* **Persistencia y Base de Datos:** Gestionada en **Google Cloud SQL (PostgreSQL)**, optimizada para garantizar la inmutabilidad de los registros jurídicos y el control estricto de versiones.

## 2. Componentes Técnicos Clave para Escalabilidad

### A. Gestión de Base de Datos y Consultas (PostgreSQL)
* **Esquema Relacional Núcleo:**
  * Tabla `documentos`: Almacena metadatos, texto oficial, número de versión actual y el campo `hash_criptografico` (SHA-256).
  * Tabla `historial_versiones`: Registra cada modificación con trazabilidad temporal (`version_anterior`, `version_nueva`, `cambios_realizados`, `timestamp`).
* **Connection Pooling:** Uso obligatorio de agrupamiento de conexiones (como `PgBouncer` o la administración nativa de Cloud SQL) para evitar la saturación de conexiones concurrentes ante consultas masivas simultáneas.
* **Indexación Estratégica:** Creación de índices en columnas de alto tráfico (`hash_criptografico`, `tipo_norma`, `fecha_vigencia`) para asegurar tiempos de respuesta en milisegundos aun con millones de registros históricos.

### B. Infraestructura y Despliegue Automatizado
* **Infraestructura como Código (IaC):** Utilización de scripts de **Terraform** para definir y provisionar los recursos de Google Cloud (redes, instancias Cloud SQL, servicios Cloud Run), permitiendo replicar o migrar el entorno en minutos.
* **Contenedores Limpios en Cloud Run:** Garantizar que los servicios backend no almacenen sesiones de forma local, permitiendo que cualquier réplica del contenedor responda de manera idéntica a las peticiones de validación.

### C. Optimización en la Red (Cloudflare)
* **Caché en el Edge:** Configuración de reglas estrictas de TTL (Tiempo de vida) mediante encabezados `Cache-Control` para assets estáticos y documentos de lectura pública generados por Astro.
* **Seguridad Global:** Activación permanente de "Always Use HTTPS" y gestión del dominio personalizado (`www.lexdigitalhd.com`) apuntando de forma directa al despliegue oficial.