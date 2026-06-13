# Replay Intel GPU 中文适配版

这是基于 Replay 的 Intel 显卡适配版本，保留原版的主要功能和界面结构，重点把本地推理从 NVIDIA/CUDA 路线改为 Intel GPU/XPU 路线，并补充中文界面与中英文语言切换。

## 主要变化

- 支持识别 Intel 显卡型号，例如 `Intel(R) Arc(TM) B580 Graphics`。
- 推理设备支持 `xpu`，PyTorch 模型会按 Intel XPU 路线加载。
- ONNX/UVR 人声分离优先使用 OpenVINO GPU 执行提供器。
- 修复新版 PyTorch 与 fairseq/hydra 的兼容问题，避免 `name 'help' is not defined` 和 `weights_only` 加载失败。
- 修复 Faiss 索引数组判断问题，避免生成中途出现 `truth value of an array` 报错。
- 软件界面支持中文和英文切换，默认英文；中文模式下尽量使用通俗中文，不保留混杂英文。
- 增加 Windows Intel GPU 构建脚本和上游同步脚本，方便后续更新后重新编译。

## 已验证环境

- 系统：Windows
- 显卡：Intel(R) Arc(TM) B580 Graphics
- 后端设备：`xpu`
- ONNX 执行器：`OpenVINOExecutionProvider`
- 验证结果：使用本地音频和 `alan` RVC 模型生成成功，输出 `final.mp3`。

## 快速使用

构建后的可运行程序位于：

```text
dist\win-unpacked\Replay.exe
```

桌面快捷方式：

```text
Replay Intel GPU.lnk
```

第一次运行后，在“推理设备”里选择 Intel 显卡。生成时日志中应能看到类似信息：

```text
Using requested job device: xpu
Hubert model loaded on xpu
OpenVINOExecutionProvider
```

说明模型确实按 Intel GPU/XPU 路线工作。音频解码、编码、文件读写和部分后处理仍会使用 CPU，因此生成时 CPU 有功耗波动是正常现象。

## 本地开发

安装前请准备：

- Node.js 19
- Yarn
- Python 3.10
- Intel 显卡驱动
- 可用的 Intel XPU/OpenVINO 运行环境

安装依赖：

```powershell
yarn install
cd python
python setup.py
cd ..
yarn dev
```

## Windows Intel GPU 构建

推荐使用项目内脚本：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-intel-windows.ps1
```

如果依赖已经安装好，只想重新打包：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-intel-windows.ps1 -SkipInstall
```

脚本会完成：

- 修补 fairseq/hydra 兼容问题。
- 打包 Python 后端。
- 构建 Electron 前端。
- 生成 `dist\win-unpacked\Replay.exe`。
- 刷新桌面快捷方式。

## 同步上游并重新适配

如果原项目有更新，可以先同步上游，再重新构建：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\sync-upstream-intel.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-intel-windows.ps1 -SkipInstall
```

同步后如果出现冲突，需要先解决冲突再构建。建议每次同步后都至少验证：

```powershell
yarn -s typecheck
yarn -s lint
```

并实际生成一段音频，确认 Intel GPU 路线仍然正常。

## 发布到 GitHub

成品 zip 不建议直接提交到仓库，应作为 GitHub Release 附件上传。先登录 GitHub CLI：

```powershell
gh auth login
```

登录后运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\publish-intel-release.ps1
```

脚本会推送当前适配分支，并把 `outputs\Replay-Intel-GPU-win-x64.zip` 上传为预发布版本附件。

## 许可证

本项目继承原 Replay 项目的 MIT 许可证。详见 [LICENSE](LICENSE)。
