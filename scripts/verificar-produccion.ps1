param(
    [Parameter(Mandatory = $true)]
    [string]$BaseUrl,

    [string]$Origin = ""
)

# Verificacion rapida del backend desplegado (issue #57).
# Uso:  .\verificar-produccion.ps1 -BaseUrl https://medicore-api.onrender.com

$BaseUrl = $BaseUrl.TrimEnd('/')
$ok = $true

function Probar($nombre, $metodo, $ruta, $esperado) {
    $url = "$BaseUrl$ruta"
    try {
        $respuesta = Invoke-WebRequest -Uri $url -Method $metodo -UseBasicParsing -TimeoutSec 30
        $codigo = [int]$respuesta.StatusCode
    } catch {
        $codigo = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    }

    $bien = ($codigo -eq $esperado)
    if (-not $bien) { $script:ok = $false }
    $marca = if ($bien) { "OK  " } else { "FALLA" }
    Write-Output ("{0}  {1,-6} {2,-28} -> {3} (esperado {4})" -f $marca, $metodo, $ruta, $codigo, $esperado)
}

Write-Output "Verificando $BaseUrl"
Write-Output "----------------------------------------"

Probar "salud" GET "/api/v1/health" 200
Probar "salud de base de datos" GET "/api/v1/health/db" 200
Probar "alertas publicas" GET "/api/v1/alerts" 200
Probar "filtros de alertas" GET "/api/v1/alerts/filters" 200
Probar "medicamentos" GET "/api/v1/medicines" 200
Probar "preferencias sin token" GET "/api/v1/me/alert-preferences" 401
Probar "botiquin sin token" GET "/api/v1/me/kit" 401
Probar "asistente sin token" POST "/api/v1/assistant/messages" 401
Probar "ruta inexistente" GET "/api/v1/no-existe" 404

if ($Origin) {
    Write-Output "----------------------------------------"
    Write-Output "CORS para origen $Origin"
    try {
        $preflight = Invoke-WebRequest -Uri "$BaseUrl/api/v1/alerts" -Method OPTIONS -UseBasicParsing `
            -Headers @{ Origin = $Origin; "Access-Control-Request-Method" = "GET" } -TimeoutSec 30
        $permitido = $preflight.Headers["Access-Control-Allow-Origin"]
        if ($permitido) {
            Write-Output "OK     Access-Control-Allow-Origin: $permitido"
        } else {
            Write-Output "FALLA  el servidor no devolvio Access-Control-Allow-Origin"
            $ok = $false
        }
    } catch {
        Write-Output "FALLA  el preflight CORS fallo: $($_.Exception.Message)"
        $ok = $false
    }
}

Write-Output "----------------------------------------"
if ($ok) {
    Write-Output "TODO BIEN: el backend responde en la URL publica."
} else {
    Write-Output "HAY FALLAS: revisa los logs de la plataforma y las variables de entorno."
}
exit $(if ($ok) { 0 } else { 1 })
