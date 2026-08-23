# Ir al directorio del proyecto
cd "H:\LexDigital\Recursos\AUTOMATIZAR INDESIGN\proyecto-lexdigital_modular"

# Verificar si ya es un repositorio Git
if [ -d ".git" ]; then
    echo "✓ Ya es un repositorio Git"
    git status
else
    echo "Inicializando repositorio Git..."
    git init
    
    # Crear .gitignore
    cat > .gitignore << EOF
node_modules/
*.log
.DS_Store
output/
output_*/
publicaciones/output/
*.tmp
backup_*
EOF
    
    echo "✓ .gitignore creado"
fi

# Hacer commit del estado actual
git add .
git commit -m "Backup pre-integración Fase 1 XHTML - $(date '+%Y-%m-%d %H:%M:%S')"

# Crear tag para marcar este punto
git tag -a "pre-xhtml-integration" -m "Estado antes de integrar módulos XHTML"

echo "✅ Backup en Git completado"
echo "📋 Tags disponibles:"
git tag -l