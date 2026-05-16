@echo off
setlocal EnableExtensions
rem Cursor sandbox sets deep TEMP/GRADLE_USER_HOME -> CMake MAX_PATH on Windows.
set "GRADLE_USER_HOME=C:\.gradle"
set "TEMP=C:\.gradle\tmp"
set "TMP=C:\.gradle\tmp"
set "JAVA_TOOL_OPTIONS=-Dgradle.user.home=C:/.gradle"
if not exist "%GRADLE_USER_HOME%" mkdir "%GRADLE_USER_HOME%" 2>nul
if not exist "%TEMP%" mkdir "%TEMP%" 2>nul
if exist "%LOCALAPPDATA%\Temp\cursor-sandbox-cache" (
  echo [windows-android-build] Removing Cursor sandbox Gradle cache...
  rmdir /s /q "%LOCALAPPDATA%\Temp\cursor-sandbox-cache" 2>nul
)
cd /d "%~dp0.."
call android\gradlew.bat --stop
node "%~dp0expo-run-android.mjs" %*
endlocal & exit /b %ERRORLEVEL%
