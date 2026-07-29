/**
 * Catálogo dinámico de publicaciones — adaptado al markup de la plantilla ColoShop.
 * Reutiliza las clases visuales de la plantilla (product-item, product_info, etc.)
 * pero con datos y lógica propios: carga index.json, filtra por categoría/formato/
 * acceso, y controla qué botones de descarga están habilitados según el "acceso"
 * de cada publicación.
 *
 * Sustituye obtenerEstadoUsuario() por tu lógica real de autenticación cuando
 * conectes un backend.
 */

(function () {
  const RUTA_INDEX = "index.json";

  const estado = {
    publicaciones: [],
    categoria: "todas",
    formato: "todos",
    acceso: "todos",
    busqueda: "",
  };

  function obtenerEstadoUsuario() {
    return { autenticado: false, tipoAcceso: null };
  }

  function usuarioTieneAcceso(nivelRequerido) {
    if (nivelRequerido === "libre") return true;
    const usuario = obtenerEstadoUsuario();
    if (!usuario.autenticado) return false;
    return usuario.tipoAcceso === nivelRequerido;
  }

  function etiquetaAcceso(nivel) {
    const mapa = {
      suscripcion: "Acceso por suscripción",
      licencia_individual: "Acceso por licencia individual",
      libre: "Acceso libre",
    };
    return mapa[nivel] || "Acceso restringido";
  }

  function iconoFormato(formato) {
    const mapa = { html: "fa-file-code-o", epub: "fa-book", pdf: "fa-file-pdf-o" };
    return mapa[formato] || "fa-file-o";
  }

  function crearTarjeta(pub) {
    const permitido = usuarioTieneAcceso(pub.acceso);
    const claseCategoria = pub.categoria
      ? pub.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
      : "sin-categoria";

    const botonesFormato = Object.entries(pub.formatos || {})
      .map(([formato, ruta]) => {
        if (!permitido) {
          return `<button class="boton-formato deshabilitado" disabled aria-disabled="true" aria-describedby="mensaje-${pub.id}">
                    <i class="fa ${iconoFormato(formato)}" aria-hidden="true"></i> ${formato.toUpperCase()}
                  </button>`;
        }
        return `<a class="boton-formato" href="${ruta}" aria-label="Abrir ${formato.toUpperCase()} — ${pub.titulo}">
                  <i class="fa ${iconoFormato(formato)}" aria-hidden="true"></i> ${formato.toUpperCase()}
                </a>`;
      })
      .join("");

    const mensajePermiso = !permitido
      ? `<p class="mensaje-permiso" id="mensaje-${pub.id}">
           Necesitas <a href="suscripcion.html">suscripción o licencia</a> para acceder.
           <a href="login.html">Iniciar sesión</a>
         </p>`
      : "";

    return `
      <div class="product-item ${claseCategoria}" data-categoria="${pub.categoria || ""}"
           data-formatos="${Object.keys(pub.formatos || {}).join(",")}" data-acceso="${pub.acceso}"
           data-titulo="${(pub.titulo || "").toLowerCase()}" data-descripcion="${(pub.descripcion || "").toLowerCase()}">
        <div class="product product_filter">
          <div class="product_image publicacion_portada" aria-hidden="true">
            <i class="fa fa-file-text-o"></i>
          </div>
          <div class="product_info">
            <span class="etiqueta-categoria">${pub.categoria || ""}</span>
            <h6 class="product_name"><a href="ficha-publicacion.html" aria-labelledby="titulo-${pub.id}"><span id="titulo-${pub.id}">${pub.titulo}</span></a></h6>
            <p class="publicacion_descripcion">${pub.descripcion || ""}</p>
            <div class="product_price estado-acceso-badge ${pub.acceso}">${etiquetaAcceso(pub.acceso)}</div>
          </div>
        </div>
        <div class="acciones-formato">${botonesFormato}</div>
        ${mensajePermiso}
      </div>`;
  }

  function poblarFiltroCategorias() {
    const contenedor = document.getElementById("filtro-categoria");
    if (!contenedor) return;
    const categorias = [...new Set(estado.publicaciones.map((p) => p.categoria).filter(Boolean))].sort();
    categorias.forEach((cat) => {
      const li = document.createElement("li");
      li.setAttribute("data-categoria", cat);
      li.innerHTML = `<a href="#">${cat}</a>`;
      contenedor.appendChild(li);
    });
  }

  function publicacionesFiltradas() {
    return estado.publicaciones.filter((pub) => {
      const okCategoria = estado.categoria === "todas" || pub.categoria === estado.categoria;
      const okFormato = estado.formato === "todos" || Object.keys(pub.formatos || {}).includes(estado.formato);
      const okAcceso = estado.acceso === "todos" || pub.acceso === estado.acceso;
      const texto = `${pub.titulo} ${pub.descripcion || ""}`.toLowerCase();
      const okBusqueda = estado.busqueda === "" || texto.includes(estado.busqueda);
      return okCategoria && okFormato && okAcceso && okBusqueda;
    });
  }

  function renderizarCatalogoCompleto() {
    const grid = document.getElementById("catalogo-grid");
    const region = document.getElementById("catalogo-estado");
    if (!grid) return;
    const resultados = publicacionesFiltradas();
    if (resultados.length === 0) {
      grid.innerHTML = "<p>No se encontraron publicaciones con los filtros seleccionados.</p>";
      if (region) region.textContent = "No hay resultados para los filtros seleccionados.";
      return;
    }
    grid.innerHTML = resultados.map(crearTarjeta).join("");
    if (region) region.textContent = `${resultados.length} publicación(es) encontradas.`;
  }

  function renderizarDestacadas() {
    const grid = document.getElementById("destacadas-grid");
    const region = document.getElementById("destacadas-estado");
    if (!grid) return;
    const destacadas = estado.publicaciones.slice(0, 6);
    grid.innerHTML = destacadas.map(crearTarjeta).join("");
    if (region) region.textContent = `${destacadas.length} publicaciones destacadas cargadas.`;
  }

  function inicializarFiltrosInteractivos() {
    document.querySelectorAll("#filtro-categoria li").forEach((li) => {
      li.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelectorAll("#filtro-categoria li").forEach((el) => el.classList.remove("active"));
        li.classList.add("active");
        estado.categoria = li.dataset.categoria || "todas";
        renderizarCatalogoCompleto();
      });
    });

    document.querySelectorAll("#filtro-formato li").forEach((li) => {
      li.addEventListener("click", () => {
        document.querySelectorAll("#filtro-formato li").forEach((el) => {
          el.classList.remove("active");
          el.querySelector("i").className = "fa fa-square-o";
        });
        li.classList.add("active");
        li.querySelector("i").className = "fa fa-check-square";
        estado.formato = li.dataset.formato || "todos";
        renderizarCatalogoCompleto();
      });
    });

    document.querySelectorAll("#filtro-acceso li").forEach((li) => {
      li.addEventListener("click", () => {
        document.querySelectorAll("#filtro-acceso li").forEach((el) => {
          el.classList.remove("active");
          el.querySelector("i").className = "fa fa-square-o";
        });
        li.classList.add("active");
        li.querySelector("i").className = "fa fa-check-square";
        estado.acceso = li.dataset.acceso || "todos";
        renderizarCatalogoCompleto();
      });
    });

    const buscador = document.getElementById("buscador-publicaciones");
    if (buscador) {
      buscador.addEventListener("input", (e) => {
        estado.busqueda = e.target.value.toLowerCase();
        renderizarCatalogoCompleto();
      });
    }
  }

  async function iniciar() {
    try {
      const respuesta = await fetch(RUTA_INDEX);
      if (!respuesta.ok) throw new Error("No se pudo cargar index.json");
      const datos = await respuesta.json();
      estado.publicaciones = datos.publicaciones || [];

      if (document.getElementById("catalogo-grid")) {
        poblarFiltroCategorias();
        inicializarFiltrosInteractivos();
        renderizarCatalogoCompleto();
      }
      if (document.getElementById("destacadas-grid")) {
        renderizarDestacadas();
      }
    } catch (error) {
      console.error(error);
      const grid = document.getElementById("catalogo-grid") || document.getElementById("destacadas-grid");
      if (grid) grid.innerHTML = '<p role="alert">No fue posible cargar el catálogo. Intenta recargar la página.</p>';
    }
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
