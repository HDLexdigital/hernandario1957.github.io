# verificar_core.ps1 (v2 - Strict Contract Auditor)
$ErrorActionPreference = "Continue"
$corePath = ".\core"
$errores = 0

function Write-Result ($Message, $IsError) {
    if ($IsError) {
        Write-Host "[X] $Message" -ForegroundColor Red
        $script:errores++
    } else {
        Write-Host "[V] $Message" -ForegroundColor Green
    }
}

Write-Host "`n=== NIVEL 1: ESTRUCTURA (HIGIENE DEL DIRECTORIO) ===" -ForegroundColor Cyan

$expectedDirs = @("accessibility", "adapters", "cidm", "compiler", "epub", "integration", "ledm", "tools")
foreach ($dir in $expectedDirs) {
    if (Test-Path (Join-Path $corePath $dir)) {
        Write-Result "Directorio base verificado: core/$dir" $false
    }
}

# Detección de anomalías estructurales
$anomalies = Get-ChildItem -Path $corePath -Directory -Recurse | Where-Object { 
    $_.Name -match "Nueva carpeta" -or 
    ($_.Name -eq "tests" -and $_.FullName -match "cidm") 
}

foreach ($anomaly in $anomalies) {
    $relPath = $anomaly.FullName.Substring($anomaly.FullName.IndexOf("core\"))
    Write-Result "Anomalía estructural detectada: $relPath" $true
}

Write-Host "`n=== NIVEL 2 Y 3: SINTAXIS JSON Y CONTRATOS ===" -ForegroundColor Cyan

$jsonFiles = Get-ChildItem -Path $corePath -Filter *.json -Recurse
foreach ($file in $jsonFiles) {
    $filePath = $file.FullName
    $relPath = $filePath.Substring($filePath.IndexOf("core\"))
    
    # Nivel 2: Parseo
    try {
        $content = Get-Content -Path $filePath -Raw
        $json = ConvertFrom-Json $content -ErrorAction Stop
    } catch {
        Write-Result "Sintaxis JSON corrupta: $relPath" $true
        continue
    }

    # Nivel 3: Contratos Específicos
    
    # 3.1 Contrato CIDM (Ignorando schemas para evaluar solo datos)
    if (($relPath -match "cidm" -or $relPath -match "fixtures") -and $relPath -notmatch "schema" -and $relPath -notmatch "ledm") {
        $isCidm = ($null -ne $json.stories -or $null -ne $json.story)
        if ($isCidm) {
            # Búsqueda estricta de blocks, prohibición de paragraphs
            $hasBlocks = $false
            $hasParagraphs = $false
            
            if ($null -ne $json.stories) {
                foreach ($s in $json.stories) { 
                    if ($null -ne $s.blocks) { $hasBlocks = $true } 
                    if ($null -ne $s.paragraphs) { $hasParagraphs = $true }
                }
            } elseif ($null -ne $json.story) {
                if ($null -ne $json.story.blocks) { $hasBlocks = $true }
                if ($null -ne $json.story.paragraphs) { $hasParagraphs = $true }
            }

            if (-not $hasBlocks) { Write-Result "CIDM sin 'blocks': $relPath" $true }
            if ($hasParagraphs) { Write-Result "CIDM contaminado con 'paragraphs' (obsoleto): $relPath" $true }
        }
    }

    # 3.2 Contrato LEDM 2.0 (Desviaciones detectadas en fixtures)
    if ($relPath -match "ledm" -or $relPath -match "constitution-art1" -or $file.Name -match "ledm-expected") {
        if ($relPath -notmatch "schema") {
            if ($null -ne $json.meta -and $null -ne $json.meta.dates) {
                Write-Result "LEDM Inválido (meta.dates no permitido): $relPath" $true
            }
            
            if ($null -ne $json.structure -and $null -ne $json.structure.blocks) {
                $blocks = $json.structure.blocks
                $hasNumber = $blocks | Where-Object { $null -ne $_.number }
                $hasRelations = $blocks | Where-Object { $null -ne $_.relations }
                $hasValue = $blocks | Where-Object { $null -ne $_.value }
                $hasContent = $blocks | Where-Object { $null -ne $_.content }

                if ($hasNumber) { Write-Result "LEDM Inválido (propiedad 'number' en bloque): $relPath" $true }
                if ($hasRelations) { Write-Result "LEDM Inválido (propiedad 'relations' en bloque): $relPath" $true }
                if ($hasValue) { Write-Result "LEDM Inválido (usa 'value' en lugar de 'text'): $relPath" $true }
                if ($hasContent) { Write-Result "LEDM Inválido (usa 'content' en lugar de 'children'): $relPath" $true }
            }
        }
    }
}

Write-Host "`n=== NIVEL 3: API Y AISLAMIENTO DEL COMPILADOR ===" -ForegroundColor Cyan

$compilerPath = Join-Path $corePath "compiler\src\semanticCompiler.js"
if (Test-Path $compilerPath) {
    $relPath = "core\compiler\src\semanticCompiler.js"
    $jsContent = Get-Content -Path $compilerPath -Raw
    
    # Comprobar exports requeridos contractualmente
    $requiredExports = @("compileCIDMToLEDM", "extractNodeText")
    foreach ($exp in $requiredExports) {
        if ($jsContent -notmatch "(?s)(export|module\.exports).*$exp") {
            Write-Result "Contrato de API Roto: Falta exportar '$exp' en $relPath" $true
        }
    }

    # Comprobar aislamiento arquitectónico real (no palabras en comentarios)
    if ($jsContent -match "app\.activeDocument") {
        Write-Result "Violación de aislamiento: API directa de InDesign detectada en $relPath" $true
    } else {
        Write-Result "Aislamiento verificado: Sin dependencias de InDesign DOM en $relPath" $false
    }
} else {
    Write-Result "No se encontró semanticCompiler.js" $true
}

Write-Host "`n=== RESULTADO FINAL ===" -ForegroundColor Cyan
if ($errores -eq 0) {
    Write-Host "ESTADO: PASSED. El core cumple estrictamente con la arquitectura." -ForegroundColor Green
    exit 0
} else {
    Write-Host "ESTADO: FAILED. Se encontraron $errores violaciones arquitectónicas o de contrato." -ForegroundColor Red
    exit 1
}