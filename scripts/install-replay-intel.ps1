$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Repository = "hejunhao2580/replay-app"
$AssetName = "Replay-Intel-GPU-win-x64.zip"
$InstallRoot = Join-Path $env:LOCALAPPDATA "Programs"
$InstallDir = Join-Path $InstallRoot "Replay Intel GPU"
$TempDir = Join-Path $env:TEMP ("replay-intel-install-" + [guid]::NewGuid().ToString("N"))
$ZipPath = Join-Path $TempDir $AssetName

function Write-Step([string]$Message) {
  Write-Host "[Replay Intel GPU] $Message"
}

function New-Shortcut {
  param(
    [string]$ShortcutPath,
    [string]$TargetPath,
    [string]$WorkingDirectory
  )

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($ShortcutPath)
  $shortcut.TargetPath = $TargetPath
  $shortcut.WorkingDirectory = $WorkingDirectory
  $shortcut.IconLocation = "$TargetPath,0"
  $shortcut.Save()
}

try {
  if ($PSVersionTable.PSVersion.Major -lt 5) {
    throw "Please run this installer in Windows PowerShell 5 or newer."
  }

  Write-Step "正在获取最新版本信息..."
  $headers = @{ "User-Agent" = "Replay-Intel-GPU-Installer" }
  $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repository/releases" -Headers $headers -TimeoutSec 60
  $release = $releases |
    Where-Object { -not $_.draft -and ($_.assets | Where-Object { $_.name -eq $AssetName }) } |
    Sort-Object -Property published_at -Descending |
    Select-Object -First 1

  if (-not $release) {
    throw "未找到可安装的 Release 附件：$AssetName"
  }

  $asset = $release.assets | Where-Object { $_.name -eq $AssetName } | Select-Object -First 1
  New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
  New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null

  Write-Step "正在下载 $($release.tag_name)..."
  Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $ZipPath -Headers $headers -TimeoutSec 3600

  Write-Step "正在安装到 $InstallDir..."
  if (Test-Path -LiteralPath $InstallDir) {
    Remove-Item -LiteralPath $InstallDir -Recurse -Force
  }
  New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
  Expand-Archive -LiteralPath $ZipPath -DestinationPath $InstallDir -Force

  $exePath = Join-Path $InstallDir "Replay.exe"
  if (-not (Test-Path -LiteralPath $exePath)) {
    throw "安装包中没有找到 Replay.exe"
  }

  Set-Content -LiteralPath (Join-Path $InstallDir "installed-version.txt") -Value $release.tag_name -Encoding UTF8

  $desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "Replay Intel GPU.lnk"
  $startMenuDir = Join-Path ([Environment]::GetFolderPath("Programs")) "Replay Intel GPU"
  New-Item -ItemType Directory -Path $startMenuDir -Force | Out-Null
  $startMenuShortcut = Join-Path $startMenuDir "Replay Intel GPU.lnk"

  Write-Step "正在创建快捷方式..."
  New-Shortcut -ShortcutPath $desktopShortcut -TargetPath $exePath -WorkingDirectory $InstallDir
  New-Shortcut -ShortcutPath $startMenuShortcut -TargetPath $exePath -WorkingDirectory $InstallDir

  Write-Step "安装完成。桌面快捷方式：$desktopShortcut"
  Write-Step "启动程序：$exePath"
} finally {
  if (Test-Path -LiteralPath $TempDir) {
    Remove-Item -LiteralPath $TempDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}
