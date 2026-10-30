@echo off
setlocal

if defined MAVEN_HOME if exist "%MAVEN_HOME%\bin\mvn.cmd" goto useMavenHome

where mvn.cmd > nul 2>&1
if not errorlevel 1 goto usePath

if exist "%USERPROFILE%\tools\apache-maven-3.9.9\bin\mvn.cmd" goto useUserTools

echo Maven 3.9.9 or newer was not found. Set MAVEN_HOME or add mvn.cmd to PATH.
exit /b 1

:useMavenHome
call "%MAVEN_HOME%\bin\mvn.cmd" %*
exit /b %ERRORLEVEL%

:usePath
call mvn.cmd %*
exit /b %ERRORLEVEL%

:useUserTools
call "%USERPROFILE%\tools\apache-maven-3.9.9\bin\mvn.cmd" %*
exit /b %ERRORLEVEL%
