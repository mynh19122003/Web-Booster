# ASCEND Launcher release assets

Build `tools/ascend-launcher/build-setup.ps1 -Test` on Windows to place `AscendLauncher_0.1.0_x64-setup.exe` here and in `tools/ascend-launcher/dist/`. The setup is a single distributable containing the release launcher and icons.

Include the generated setup in the deployed website's `public/downloads/` directory, or set `NEXT_PUBLIC_ASCEND_LAUNCHER_DOWNLOAD_URL` to the actual hosted release asset before building the website. The current release setup is committed here so deployments from main provide a working download. Rebuild and commit the setup plus its SHA256 sidecar whenever publishing a launcher update. Do not distribute `LauncherTests.exe` or `PickerReview.exe`.
