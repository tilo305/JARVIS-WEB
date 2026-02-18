# electron-builder resources

This directory is the **buildResources** folder for [electron-builder](https://www.electron.build/). Place icons and optional assets here so packaged installers use your app icon instead of the default Electron icon.

## Icons

| Platform | File(s) | Notes |
|----------|---------|--------|
| **Windows** | `icon.ico` or `icon.png` | At least 256×256. Placed in `build/` for NSIS/portable. |
| **macOS** | `icon.icns` or `icon.png` or `icon.icon` | At least 512×512. `.icon` (asset catalog) preferred on newer Xcode. |
| **Linux** | Auto-generated from macOS `icon.icns` or `icon.png`, or add `256x256.png`, etc. in `build/icons/` | Sizes: 16, 32, 48, 64, 128, 256 (or 512). |

If no icon is provided, electron-builder uses the default Electron icon.

## Optional (macOS DMG)

- `background.png` — DMG window background
- `background@2x.png` — DMG Retina background

## References

- [Icons — electron.build](https://www.electron.build/icons)
- [Application Contents / buildResources](https://www.electron.build/contents)
