# Catálogo de componentes

Documentación de los componentes reutilizables de LexDigitalHD.

## ThemeToggle.astro

Selector de tema claro/oscuro/auto con tres botones (sol, luna, monitor).

Props: ninguna

Uso:

    <ThemeToggle />

Comportamiento:

- Al hacer click guarda la preferencia en localStorage
- Aplica la clase dark o sepia al elemento html
- Marca visualmente el botón activo

Ubicación: src/components/ThemeToggle.astro

## NormaCard.astro

Card que representa una norma en el listado de /normativa.

Props:

- slug (string, requerido)
- title (string, requerido)
- tipo (string, opcional) — ley, decreto, resolucion, ordenanza
- numero (string, opcional)
- fecha (Date, opcional)
- resumen (string, opcional)
- materia (string, opcional)
- vigente (boolean, default true)

Uso:

    <NormaCard
      slug={n.slug}
      title={n.data.title}
      tipo={n.data.tipo}
      fecha={n.data.fecha}
    />

Ubicación: src/components/NormaCard.astro

## Breadcrumbs.astro

Ruta de navegación jerárquica con link en cada nivel.

Props:

- items (array de { label, href? }) — el último sin href

Uso:

    <Breadcrumbs items={[
      { label: 'Inicio', href: '/' },
      { label: 'Normativa', href: '/normativa' },
      { label: 'Ley 27.742' }
    ]} />

Ubicación: src/components/Breadcrumbs.astro

## ReadingProgress.astro

Barra horizontal delgada en la parte superior que muestra el progreso
de lectura de la página.

Props: ninguna

Uso:

    <ReadingProgress />

Comportamiento: se llena al scrollear, sin JavaScript bloqueante.

Ubicación: src/components/ReadingProgress.astro

## TocSidebar.astro

Índice lateral sticky con los headings del artículo.

Props:

- headings (array de { depth, slug, text }) — viene de Astro

Uso:

    <TocSidebar headings={headings} />

Comportamiento:

- Filtra solo h2 y h3
- Los h3 se indentan
- Se oculta en mobile (menor a lg)
- El link activo se resalta con borde izquierdo

Ubicación: src/components/TocSidebar.astro

## CiteButton.astro

Botón que copia al portapapeles la cita bibliográfica de la norma.

Props:

- title (string, requerido)
- tipo (string, opcional) — ley, decreto, etc.
- numero (string, opcional)
- fecha (Date, opcional)
- slug (string, requerido)

Uso:

    <CiteButton title={d.title} tipo={d.tipo} numero={d.numero} fecha={d.fecha} slug={entry.slug} />

Comportamiento:

- Genera una cita estilo APA: "Tipo Nro, Título, Año. LexDigitalHD, URL"
- Al clickear copia al portapapeles y muestra "Copiada" por 2 segundos

Ubicación: src/components/CiteButton.astro

## ControlesLectura.astro

Controles de tamaño de fuente para la lectura de una norma.

Props: ninguna

Uso:

    <ControlesLectura />

Comportamiento:

- 3 botones: A- (achicar), Normal (reset), A+ (agrandar)
- 5 tamaños posibles: 0.95rem a 1.5rem
- La elección se guarda en localStorage
- Afecta solo al elemento #norma-content
- Anuncia el cambio por aria-live para lectores de pantalla

Ubicación: src/components/ControlesLectura.astro

## Navbar.astro

Barra de navegación alternativa (no usada actualmente).

Estado: huérfano, conservado por si se necesita una versión reducida
del header en alguna página específica.

Ubicación: src/components/Navbar.astro

## Footer.astro

Footer alternativo (no usado actualmente).

Estado: huérfano, conservado por si se necesita un footer reducido en
páginas embebidas o landings específicas.

Ubicación: src/components/Footer.astro

## Convenciones

Reglas para crear componentes nuevos:

1. Usar tokens semánticos, nunca colores fijos
   Mal: bg-slate-900 text-white
   Bien: bg-surface text-content

2. Aceptar props tipadas con interface Props

3. Documentar con un comentario arriba del frontmatter

4. Accesibilidad: aria-label en botones con solo ícono,
   aria-live en cambios dinámicos importantes,
   focus-visible con ring-2 ring-brand-600

5. Un componente por archivo, nombre en PascalCase

## Referencias

- Astro components: https://docs.astro.build/en/core-concepts/astro-components/
- TailwindCSS: https://tailwindcss.com/docs
- WCAG 2.2 AA: https://www.w3.org/WAI/WCAG22/quickref/

## Precio.astro

Muestra el precio de una publicación según su tipo de acceso y moneda.

Props:

- tipoAcceso ('gratis' | 'pago' | 'suscripcion')
- precioCOP (number) — precio base en pesos colombianos
- precioUSD (number, opcional)
- descuento (number, opcional) — porcentaje 0-100

Uso:

    <Precio
      tipoAcceso={d.tipoAcceso}
      precioCOP={d.precioCOP}
      precioUSD={d.precioUSD}
      descuento={d.descuentoPorcentaje}
    />

Comportamiento:

- Si es gratis: badge verde "Gratis"
- Si es suscripción: badge morado "Suscripción"
- Si es pago: precio formateado en COL$, con tachado si hay descuento,
  y precio en USD si está definido
- Usa Intl.NumberFormat con locale es-CO y currency COP

Ubicación: src/components/Precio.astro

## CardPublicacion.astro

Card de producto para el catálogo.

Props:

- slug, titulo, autores[], resumenCorto
- portada, portadaAlt
- tipoAcceso, precioCOP, precioUSD, descuentoPorcentaje
- formatos[] (html, epub, pdf-accesible, pdf-fijo, pwa)
- destacado, novedad (boolean)

Uso:

    <CardPublicacion
      slug={p.slug}
      titulo={p.data.titulo}
      autores={p.data.autores}
      resumenCorto={p.data.resumenCorto}
      portada={p.data.portada}
      portadaAlt={p.data.portadaAlt}
      tipoAcceso={p.data.tipoAcceso}
      precioCOP={p.data.precioCOP}
      precioUSD={p.data.precioUSD}
      descuentoPorcentaje={p.data.descuentoPorcentaje}
      formatos={p.data.formatos}
      destacado={p.data.destacado}
      novedad={p.data.novedad}
    />

Comportamiento:

- Portada con efecto zoom en hover
- Badge "Destacado" (dorado) o "Novedad" (azul) arriba a la izquierda
- Título, autores, resumen corto
- Badges de formatos disponibles
- Precio formateado con el componente Precio
- Botón "Ver" que lleva a la ficha de producto

Ubicación: src/components/CardPublicacion.astro
