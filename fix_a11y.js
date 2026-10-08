const fs = require('fs');
const cheerio = require('cheerio');

const htmlPath = '/home/donache/Paso01_Ingesta_Word/public/dossier_siosi.html';
const html = fs.readFileSync(htmlPath, 'utf8');

const $ = cheerio.load(html);

// Fix colors in CSS
let htmlOut = html.replace('--text-muted: #9aa1b2;', '--text-muted: #b0b8cc;');
const doc = cheerio.load(htmlOut);

// ARIA to header controls
doc('.controls a[href*="arriero"]').attr('aria-label', 'Ver la obra del Arriero Cuántico y la invocación de Sizas');
doc('.controls button[onclick="openInfografiaModal()"]').attr('aria-haspopup', 'dialog').attr('aria-label', 'Desplegar Infografía');
doc('.controls a.btn-portal').attr('aria-label', 'Portal LexDigitalHD (Abre en pestaña nueva)');
doc('#btnSound').attr('aria-label', 'Desactivar sonido').attr('aria-pressed', 'true');
doc('button[onclick="toggleTheme()"]').attr('aria-label', 'Alternar modo de color oscuro o claro');
doc('button[onclick="window.print()"]').attr('aria-label', 'Imprimir el documento o guardar en PDF');

// ARIA to Tablist
doc('#tabsBar').attr('role', 'tablist').attr('aria-label', 'Cartas de Cierre Inmediato');
doc('.tab-btn').each((i, el) => {
    const $el = doc(el);
    $el.attr('role', 'tab');
    $el.attr('aria-selected', $el.hasClass('active') ? 'true' : 'false');
    $el.attr('aria-controls', 'tab-' + i);
    $el.attr('id', 'tab-btn-' + i);
    $el.attr('tabindex', $el.hasClass('active') ? '0' : '-1');
});

// ARIA to Tab Panels
doc('.tab-content').each((i, el) => {
    const $el = doc(el);
    $el.attr('role', 'tabpanel');
    $el.attr('aria-labelledby', 'tab-btn-' + i);
    $el.attr('tabindex', '0');
    if (!$el.hasClass('active')) {
        $el.attr('hidden', 'true');
    }
});

// Editable Letter Paper ARIA
doc('.letter-paper').each((i, el) => {
    const $el = doc(el);
    $el.attr('role', 'textbox');
    $el.attr('aria-multiline', 'true');
    $el.attr('aria-label', 'Contenido editable de la carta');
});

// Buttons inside tab panels
doc('button[onclick^="clearLetter"]').attr('aria-label', 'Vaciar espacio de la carta');
doc('button[onclick^="saveLetter"]').attr('aria-label', 'Guardar contenido de la carta');

// Modal ARIA
doc('.modal-container').attr('role', 'dialog').attr('aria-modal', 'true').attr('aria-labelledby', 'modal-title');
doc('.modal-title').attr('id', 'modal-title');
doc('button[onclick="closeInfografiaModal()"]').attr('aria-label', 'Cerrar visor de infografía');

// We also need to fix the javascript switchTab function so it handles aria states
let finalHtml = doc.html();
const oldJs = `        function switchTab(index) {
            playLeadClank();
            const btns = document.querySelectorAll('.tab-btn');
            const contents = document.querySelectorAll('.tab-content');
            
            btns.forEach((b, i) => b.classList.toggle('active', i === index));
            contents.forEach((c, i) => c.classList.toggle('active', i === index));
        }`;

const newJs = `        function switchTab(index) {
            playLeadClank();
            const btns = document.querySelectorAll('.tab-btn');
            const contents = document.querySelectorAll('.tab-content');
            
            btns.forEach((b, i) => {
                const isActive = (i === index);
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-selected', isActive.toString());
                b.setAttribute('tabindex', isActive ? '0' : '-1');
            });
            contents.forEach((c, i) => {
                const isActive = (i === index);
                c.classList.toggle('active', isActive);
                if (isActive) {
                    c.removeAttribute('hidden');
                } else {
                    c.setAttribute('hidden', 'true');
                }
            });
        }
        
        // Tab accessibility keyboard navigation
        document.addEventListener('DOMContentLoaded', () => {
            const tablist = document.getElementById('tabsBar');
            if (tablist) {
                tablist.addEventListener('keydown', (e) => {
                    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
                    const currentIndex = tabs.findIndex(t => t === document.activeElement);
                    if (currentIndex === -1) return;
                    
                    let newIndex = currentIndex;
                    if (e.key === 'ArrowRight') {
                        newIndex = (currentIndex + 1) % tabs.length;
                    } else if (e.key === 'ArrowLeft') {
                        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                    } else if (e.key === 'Home') {
                        newIndex = 0;
                    } else if (e.key === 'End') {
                        newIndex = tabs.length - 1;
                    }
                    
                    if (newIndex !== currentIndex) {
                        e.preventDefault();
                        tabs[newIndex].focus();
                        switchTab(newIndex);
                    }
                });
            }
        });`;

finalHtml = finalHtml.replace(oldJs, newJs);

// audio button state
const oldToggleSound = `        function toggleSound() {
            soundEnabled = !soundEnabled;
            const btn = document.getElementById('btnSound');
            btn.textContent = soundEnabled ? '🔔 Audio: ON' : '🔕 Audio: OFF';
            if (soundEnabled) playLeadClank();
        }`;
const newToggleSound = `        function toggleSound() {
            soundEnabled = !soundEnabled;
            const btn = document.getElementById('btnSound');
            btn.textContent = soundEnabled ? '🔔 Audio: ON' : '🔕 Audio: OFF';
            btn.setAttribute('aria-pressed', soundEnabled.toString());
            btn.setAttribute('aria-label', soundEnabled ? 'Desactivar sonido' : 'Activar sonido');
            if (soundEnabled) playLeadClank();
        }`;
finalHtml = finalHtml.replace(oldToggleSound, newToggleSound);

fs.writeFileSync(htmlPath, finalHtml, 'utf8');
console.log('✅ A11y optimizado');
