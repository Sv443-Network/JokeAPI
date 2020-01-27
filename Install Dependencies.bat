@echo off

echo.
echo Installing dependencies...
echo.
echo.

call npm i --save

echo.
echo.

IF %ERRORLEVEL% NEQ 1 (
    echo Successfully installed all dependencies.
    echo.
    PAUSE
    EXIT 0
) ELSE (
    echo Error while installing dependencies.
    echo There is likely additional log output above.
    echo.
    PAUSE
    EXIT 1
)