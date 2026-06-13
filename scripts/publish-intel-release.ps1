param(
  [string]$Repository = "THE-SINDOL/replay-app",
  [string]$Branch = "codex/intel-gpu-xpu-openvino-cn",
  [string]$ZipPath = "..\..\outputs\Replay-Intel-GPU-win-x64.zip",
  [string]$Tag = ""
)

$ErrorActionPreference = "Stop"

function Resolve-Gh {
  $cmd = Get-Command gh -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $wingetGh = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\GitHub.cli_Microsoft.Winget.Source_8wekyb3d8bbwe\bin\gh.exe"
  if (Test-Path -LiteralPath $wingetGh) {
    return $wingetGh
  }

  throw "GitHub CLI was not found. Install it with: winget install --id GitHub.cli --source winget"
}

$gh = Resolve-Gh
& $gh auth status | Out-Host

$zip = Resolve-Path -LiteralPath $ZipPath
if (-not (Test-Path -LiteralPath $zip)) {
  throw "Release zip not found: $ZipPath"
}

if (-not $Tag) {
  $Tag = "intel-gpu-" + (Get-Date -Format "yyyyMMdd-HHmm")
}

git switch $Branch
git push -u origin $Branch

$notes = @"
Replay Intel GPU Windows build

- Intel GPU/XPU inference path.
- OpenVINO GPU provider for supported ONNX/UVR work.
- Chinese/English UI switching.
- Verified with Intel(R) Arc(TM) B580 Graphics.
- SHA256: $((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash)
"@

$notesFile = Join-Path $env:TEMP "replay-intel-release-notes.md"
Set-Content -LiteralPath $notesFile -Value $notes -Encoding UTF8

& $gh release create $Tag $zip `
  --repo $Repository `
  --target $Branch `
  --title "Replay Intel GPU Windows $Tag" `
  --notes-file $notesFile `
  --prerelease

Write-Host "Published release $Tag to $Repository"
