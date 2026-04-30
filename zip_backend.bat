@echo off
echo --------------------------------------------------
echo [ DCCE Backend Zipper ]
echo --------------------------------------------------
echo Zipping files (excluding node_modules and dist)...

powershell -Command "Get-ChildItem -Path . -Exclude 'node_modules', 'dist', '*.zip', '.git', 'zip_backend.bat' | Compress-Archive -DestinationPath .\backend_code.zip -Force"

echo.
echo --------------------------------------------------
echo SUCCESS: backend_code.zip has been created!
echo --------------------------------------------------
pause
