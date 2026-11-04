# Inicia sesion en el backend de desarrollo.
# Si el usuario no existe (por ejemplo tras reiniciar el backend con H2 en
# memoria), lo crea automaticamente y vuelve a entrar.
#
# Uso:
#   .\dev-login.ps1
#   .\dev-login.ps1 -Email otro@medicore.com -Password OtraClave123
#   .\dev-login.ps1 -Api http://localhost:8081/api/v1

param(
    [string]$Email = 'jainer@medicore.com',
    [string]$Password = 'Contrasena123',
    [string]$Api = 'http://localhost:8080/api/v1'
)

$ErrorActionPreference = 'Stop'
$credenciales = @{ email = $Email; password = $Password } | ConvertTo-Json

function Invoke-Login {
    Invoke-RestMethod -Method Post -Uri "$Api/auth/login" `
        -ContentType 'application/json' -Body $credenciales -TimeoutSec 20
}

try {
    $login = Invoke-Login
    Write-Host "Sesion iniciada: $Email" -ForegroundColor Green
} catch {
    $codigo = $null
    if ($_.Exception.Response) { $codigo = [int]$_.Exception.Response.StatusCode }

    if ($codigo -eq 401 -or $codigo -eq 409 -or $codigo -eq $null) {
        # La cuenta no existe (o el backend se reinicio): la creamos
        $nuevo = @{
            email    = $Email
            password = $Password
            name     = ($Email -split '@')[0]
        } | ConvertTo-Json

        try {
            Invoke-RestMethod -Method Post -Uri "$Api/auth/register" `
                -ContentType 'application/json' -Body $nuevo -TimeoutSec 20 | Out-Null
            Write-Host "Cuenta creada: $Email" -ForegroundColor Yellow
        } catch {
            Write-Host "No se pudo crear la cuenta: $($_.Exception.Message)" -ForegroundColor Red
            throw
        }

        $login = Invoke-Login
        Write-Host "Sesion iniciada: $Email" -ForegroundColor Green
    } else {
        Write-Host "Error al iniciar sesion (HTTP $codigo). Revisa que el backend este corriendo en $Api" -ForegroundColor Red
        throw
    }
}

Write-Host ""
Write-Host "Copia esta linea en tu terminal:"
Write-Host ('$h = @{ Authorization = "Bearer ' + $login.token + '" }') -ForegroundColor Cyan
Write-Host ""
Write-Host "Ejemplo de uso del asistente:"
Write-Host ('Invoke-RestMethod -Method Post -Uri "' + $Api + '/assistant/messages" -Headers $h -ContentType "application/json" -Body ''{"message":"hola"}''')
Write-Host ""
Write-Host "Token:" $login.token -ForegroundColor DarkGray
