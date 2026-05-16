# One-time fix: junction Cursor sandbox Gradle cache -> C:\.gradle and clean native CMake caches.
# Run from external PowerShell (Admin not required for junction if you own the folders):
#   powershell -ExecutionPolicy Bypass -File scripts/fix-windows-gradle-path.ps1

$ErrorActionPreference = 'Stop'
$gradleHome = 'C:\.gradle'
$tmp = Join-Path $gradleHome 'tmp'
New-Item -ItemType Directory -Force -Path $gradleHome, $tmp | Out-Null

$sandboxRoot = Join-Path $env:LOCALAPPDATA 'Temp\cursor-sandbox-cache'
if (Test-Path $sandboxRoot) {
  Get-ChildItem $sandboxRoot -Directory | ForEach-Object {
    $link = Join-Path $_.FullName 'gradle'
    if (Test-Path $link) {
      cmd /c "rmdir `"$link`"" 2>$null
      Remove-Item -LiteralPath $link -Recurse -Force -ErrorAction SilentlyContinue
    }
    New-Item -ItemType Directory -Force -Path $_.FullName | Out-Null
    cmd /c "mklink /J `"$link`" `"$gradleHome`""
    Write-Host "Junction: $link -> $gradleHome"
  }
}

$root = Split-Path $PSScriptRoot -Parent
Push-Location (Join-Path $root 'android')
& .\gradlew.bat --stop
Pop-Location

$clean = @(
  'android\.gradle', 'android\build', 'android\app\build',
  'node_modules\expo-modules-core\android\.cxx',
  'node_modules\react-native-screens\android\.cxx',
  'node_modules\react-native-gesture-handler\android\.cxx'
)
foreach ($rel in $clean) {
  $p = Join-Path $root $rel
  if (Test-Path $p) {
    Remove-Item -LiteralPath $p -Recurse -Force
    Write-Host "Removed $rel"
  }
}

Write-Host "Done. Run: node scripts/expo-run-android.mjs"
