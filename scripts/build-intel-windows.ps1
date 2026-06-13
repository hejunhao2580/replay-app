param(
  [switch]$SkipPythonBundle,
  [switch]$SkipShortcut,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $RepoRoot

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Block
  )
  Write-Host ""
  Write-Host "==> $Name"
  & $Block
}

function Invoke-NativeCommand {
  param(
    [string]$FilePath,
    [string[]]$Arguments = @()
  )
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath failed with exit code $LASTEXITCODE"
  }
}

function Stop-ExistingProductProcesses {
  $ProductDir = Join-Path $RepoRoot "dist\win-unpacked"
  if (-not (Test-Path -LiteralPath $ProductDir)) {
    return
  }
  $ResolvedProductDir = (Resolve-Path -LiteralPath $ProductDir).Path
  Get-Process | Where-Object {
    $_.Path -and $_.Path.StartsWith($ResolvedProductDir, [System.StringComparison]::OrdinalIgnoreCase)
  } | Stop-Process -Force
  Start-Sleep -Milliseconds 500
}

Stop-ExistingProductProcesses

function Remove-InRepo {
  param([string]$RelativePath)
  $Target = Join-Path $RepoRoot $RelativePath
  if (-not (Test-Path -LiteralPath $Target)) {
    return
  }
  $Resolved = (Resolve-Path -LiteralPath $Target).Path
  if (-not $Resolved.StartsWith($RepoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove path outside repo: $Resolved"
  }
  Remove-Item -LiteralPath $Resolved -Recurse -Force
}

function Ensure-PythonVenv {
  $Python = Join-Path $RepoRoot ".venv-intel310\Scripts\python.exe"
  if (-not (Test-Path -LiteralPath $Python)) {
    if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
      throw "Python launcher 'py' was not found. Install Python 3.10 and run this script again."
    }
    Invoke-NativeCommand "py" @("-3.10", "-m", "venv", ".venv-intel310")
  }
  return (Resolve-Path -LiteralPath $Python).Path
}

if (-not $SkipInstall) {
  Invoke-Step "Install or update frontend dependencies" {
    Invoke-NativeCommand "yarn" @("install", "--frozen-lockfile")
  }

  $Python = Ensure-PythonVenv
  Invoke-Step "Install or update Intel GPU backend dependencies" {
    Invoke-NativeCommand $Python @("-m", "pip", "install", "pip<24.1", "setuptools", "wheel")
    Invoke-NativeCommand $Python @("-m", "pip", "install", "--index-url", "https://download.pytorch.org/whl/xpu", "--extra-index-url", "https://pypi.org/simple", "torch>=2.5.0", "torchaudio>=2.5.0")
    Invoke-NativeCommand $Python @("-m", "pip", "install", "onnxruntime-openvino")
    Invoke-NativeCommand $Python @("-m", "pip", "install", "-r", "python\requirements.txt")
    Invoke-NativeCommand $Python @("python\repair_deps.py")
  }

  Invoke-Step "Prepare ffmpeg, ffprobe, and Electron hooks" {
    Invoke-NativeCommand "node" @("node_modules\ffmpeg-static-fork\install.js")
    Invoke-NativeCommand "node" @("node_modules\ffprobe-static-fork\install.js")
    Invoke-NativeCommand "yarn" @("-s", "build:notarize")
  }
} else {
  $Python = Ensure-PythonVenv
}

if (-not $SkipPythonBundle) {
  Invoke-Step "Bundle Intel GPU backend" {
    Remove-InRepo "python\build"
    Remove-InRepo "python\dist"
    Push-Location "python"
    try {
      Invoke-NativeCommand $Python @("repair_deps.py")
      Invoke-NativeCommand $Python @("bundle.py")
    } finally {
      Pop-Location
    }
  }
}

Invoke-Step "Check TypeScript" {
  Invoke-NativeCommand "yarn" @("-s", "typecheck")
}

Invoke-Step "Build Electron frontend" {
  Invoke-NativeCommand "yarn" @("-s", "build:electron")
}

Invoke-Step "Create Windows app folder" {
  Stop-ExistingProductProcesses
  Remove-InRepo "dist"
  Invoke-NativeCommand "yarn" @("-s", "electron-builder", "--dir", "--win")
}

if (-not $SkipShortcut) {
  Invoke-Step "Refresh desktop shortcut" {
    $Exe = (Resolve-Path "dist\win-unpacked\Replay.exe").Path
    $Desktop = [Environment]::GetFolderPath("Desktop")
    $LinkPath = Join-Path $Desktop "Replay Intel GPU.lnk"
    $Shell = New-Object -ComObject WScript.Shell
    $Shortcut = $Shell.CreateShortcut($LinkPath)
    $Shortcut.TargetPath = $Exe
    $Shortcut.WorkingDirectory = Split-Path $Exe
    $Shortcut.IconLocation = "$Exe,0"
    $Shortcut.Description = "Replay Intel GPU"
    $Shortcut.Save()
    Write-Host "Shortcut: $LinkPath"
  }
}

Write-Host ""
Write-Host "Done: dist\win-unpacked\Replay.exe"
