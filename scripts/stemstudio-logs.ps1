param(
    [ValidateSet('all', 'backend', 'frontend')]
    [string]$Target = 'all'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path $root '.stemstudio\logs'

function Show-LogTail {
    param([Parameter(Mandatory = $true)][string]$Name)
    $logFile = Join-Path $logPath "$Name.log"
    $errFile = Join-Path $logPath "$Name.err.log"
    if (-not (Test-Path $logFile)) {
        Write-Host "$Name log belum ada: $logFile"
    } else {
        Write-Host "===== $Name (stdout) ====="
        Get-Content -LiteralPath $logFile -Tail 40
    }
    if (Test-Path $errFile) {
        Write-Host "===== $Name (stderr) ====="
        Get-Content -LiteralPath $errFile -Tail 40
    }
}

if ($Target -eq 'all' -or $Target -eq 'backend') {
    Show-LogTail -Name 'backend'
}
if ($Target -eq 'all' -or $Target -eq 'frontend') {
    Show-LogTail -Name 'frontend'
}
