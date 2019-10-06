@echo off
echo Calling ESLint to lint the code...
echo.
call eslint ./
echo.
IF %ERRORLEVEL% == 0 (
    echo The linter didn't find any errors in the code.
    echo You may now publish the changes.
    echo.
    EXIT 0
) ELSE (
    EXIT 1
)