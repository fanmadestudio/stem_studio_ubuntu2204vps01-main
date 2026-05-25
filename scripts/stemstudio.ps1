param(
    [switch]$NoNewWindow,
    [switch]$UseLocalIp
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $root 'backend'
$frontendPath = Join-Path $root 'frontend'

if (-not (Test-Path $backendPath)) {
    throw "Backend folder not found: $backendPath"
}
if (-not (Test-Path $frontendPath)) {
    throw "Frontend folder not found: $frontendPath"
}

function Convert-ToEncodedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command
    )
    return [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
}

function Get-LocalIPv4 {
    $ip = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -ne '127.0.0.1' -and
            $_.PrefixOrigin -ne 'WellKnown' -and
            $_.IPAddress -notlike '169.254.*'
        } |
        Select-Object -ExpandProperty IPAddress -First 1
    return $ip
}

function Start-PowerShellWindow {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command
    )
    $encoded = Convert-ToEncodedCommand -Command $Command
    Start-Process powershell -ArgumentList @('-NoExit', '-EncodedCommand', $encoded) -WindowStyle Normal
}

if ($NoNewWindow) {
    Write-Host 'Starting backend in current window...'
    $backendNoWindow = @'
Set-Location -LiteralPath "__BACKEND_PATH__"
py -3 manage.py runserver 0.0.0.0:8000
'@.Replace('__BACKEND_PATH__', $backendPath)
    $backendNoWindowEncoded = Convert-ToEncodedCommand -Command $backendNoWindow
    Start-Job -Name 'stem-backend' -ScriptBlock {
        param($encoded)
        powershell -NoExit -EncodedCommand $encoded
    } -ArgumentList $backendNoWindowEncoded | Out-Null

    Write-Host 'Starting frontend in current window...'
    $frontendNoWindow = @'
Set-Location -LiteralPath "__FRONTEND_PATH__"
npm run dev
'@.Replace('__FRONTEND_PATH__', $frontendPath)
    $frontendNoWindowEncoded = Convert-ToEncodedCommand -Command $frontendNoWindow
    Start-Job -Name 'stem-frontend' -ScriptBlock {
        param($encoded)
        powershell -NoExit -EncodedCommand $encoded
    } -ArgumentList $frontendNoWindowEncoded | Out-Null

    Write-Host 'Both jobs started. Use Get-Job and Receive-Job to inspect logs.'
} else {
    $url = 'http://localhost:3000/'
    if ($UseLocalIp) {
        $localIp = Get-LocalIPv4
        if ($localIp) {
            $url = "http://$localIp`:3000/"
        } else {
            Write-Host 'Local IP not found, fallback to localhost.'
        }
    }

    $backendCmd = @'
Set-Location -LiteralPath "__BACKEND_PATH__"
py -3 manage.py runserver 0.0.0.0:8000
'@.Replace('__BACKEND_PATH__', $backendPath)

    $frontendCmd = @'
Set-Location -LiteralPath "__FRONTEND_PATH__"
npm run dev
'@.Replace('__FRONTEND_PATH__', $frontendPath)

    Write-Host 'Opening backend PowerShell window...'
    Start-PowerShellWindow -Command $backendCmd

    Write-Host 'Opening frontend PowerShell window...'
    Start-PowerShellWindow -Command $frontendCmd

    Write-Host "Opening browser: $url"
    Start-Process $url

    Write-Host 'Cold start launched: backend and frontend are running in separate windows.'
}
