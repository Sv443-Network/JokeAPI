@echo off
echo Calling ESLint to lint the code...
echo.
call eslint ./
echo.
IF %ERRORLEVEL% == 0 (
    echo The linter didn't find any errors in the code.
    echo The changes may now be published.
    echo.
    EXIT 0
) ELSE (
    EXIT 1
)