from __future__ import annotations

import json
import logging
import os
import subprocess
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Literal, Optional

import torch

DEVICE = Literal["cpu", "xpu", "mps"]

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class DeviceInfo:
    id: DEVICE
    label: str
    backend: str
    model: Optional[str] = None
    torch_device: Optional[str] = None
    ort_provider: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def normalize_device(device: str) -> DEVICE:
    normalized = (device or "cpu").strip().lower()
    if normalized.startswith("xpu"):
        return "xpu"
    if normalized.startswith("mps"):
        return "mps"
    return "cpu"


def torch_xpu_is_available() -> bool:
    xpu = getattr(torch, "xpu", None)
    if xpu is None:
        return False
    is_available = getattr(xpu, "is_available", None)
    if not callable(is_available):
        return False
    try:
        return bool(is_available())
    except Exception as exc:
        logger.info("Unable to query Intel XPU availability: %s", exc)
        return False


def torch_xpu_device_count() -> int:
    if not torch_xpu_is_available():
        return 0
    device_count = getattr(torch.xpu, "device_count", None)
    if not callable(device_count):
        return 1
    try:
        return int(device_count())
    except Exception:
        return 1


def _torch_xpu_device_name(index: int = 0) -> Optional[str]:
    if not torch_xpu_is_available():
        return None
    get_device_name = getattr(torch.xpu, "get_device_name", None)
    if callable(get_device_name):
        try:
            name = get_device_name(index)
            return str(name) if name else None
        except Exception as exc:
            logger.info("Unable to query Intel XPU device name: %s", exc)
    return None


def _windows_intel_gpu_names() -> list[str]:
    if os.name != "nt":
        return []

    command = [
        "powershell",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "Get-CimInstance Win32_VideoController | "
        "Select-Object Name,PNPDeviceID,AdapterRAM | ConvertTo-Json -Compress",
    ]
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=5)
    except Exception as exc:
        logger.info("Unable to query Windows display adapters: %s", exc)
        return []

    if result.returncode != 0 or not result.stdout.strip():
        return []

    try:
        parsed = json.loads(result.stdout)
    except json.JSONDecodeError:
        return []

    adapters = parsed if isinstance(parsed, list) else [parsed]
    names: list[str] = []
    for adapter in adapters:
        name = str(adapter.get("Name") or "").strip()
        pnp = str(adapter.get("PNPDeviceID") or "").strip()
        if "intel" in name.lower() or "ven_8086" in pnp.lower():
            names.append(name)
    return _dedupe(names)


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        key = value.strip().lower()
        if value and key not in seen:
            seen.add(key)
            result.append(value.strip())
    return result


def intel_gpu_names() -> list[str]:
    names = [_torch_xpu_device_name(index) for index in range(torch_xpu_device_count())]
    names = [name for name in names if name]
    names.extend(_windows_intel_gpu_names())
    return _dedupe(names)


def _ort_openvino_provider_available() -> bool:
    try:
        import onnxruntime as ort

        return "OpenVINOExecutionProvider" in ort.get_available_providers()
    except Exception as exc:
        logger.info("Unable to query ONNX Runtime providers: %s", exc)
        return False


def openvino_cache_dir() -> str:
    cache_dir = Path(os.environ.get("REPLAY_OPENVINO_CACHE_DIR", Path(tempfile.gettempdir()) / "replay-openvino-cache"))
    cache_dir.mkdir(parents=True, exist_ok=True)
    return str(cache_dir)


def ort_providers_for_device(device: DEVICE) -> list[Any]:
    if device == "xpu" and _ort_openvino_provider_available():
        return [
            ("OpenVINOExecutionProvider", {"device_type": "GPU", "cache_dir": openvino_cache_dir()}),
            "CPUExecutionProvider",
        ]
    if device == "mps":
        return ["CoreMLExecutionProvider", "CPUExecutionProvider"]
    return ["CPUExecutionProvider"]


def primary_device() -> DEVICE:
    if torch_xpu_is_available():
        return "xpu"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def available_devices() -> list[DeviceInfo]:
    devices: list[DeviceInfo] = [
        DeviceInfo(id="cpu", label="CPU（处理器，速度较慢）", backend="cpu", torch_device="cpu")
    ]

    if torch_xpu_is_available():
        names = intel_gpu_names()
        model = names[0] if names else "Intel GPU"
        devices.append(
            DeviceInfo(
                id="xpu",
                label=f"Intel GPU（{model}）",
                backend="xpu",
                model=model,
                torch_device="xpu",
                ort_provider="OpenVINOExecutionProvider" if _ort_openvino_provider_available() else None,
            )
        )

    if torch.backends.mps.is_available():
        devices.append(DeviceInfo(id="mps", label="Apple GPU（MPS 加速）", backend="mps", torch_device="mps"))

    return devices


def device_details(active_device: Optional[str] = None) -> dict[str, Any]:
    active = normalize_device(active_device) if active_device else primary_device()
    active_detail = next((device for device in available_devices() if device.id == active), None)
    return {
        "activeDevice": active,
        "activeLabel": active_detail.label if active_detail else active.upper(),
        "intelGpuModel": (intel_gpu_names() or [None])[0],
        "ortProviders": [provider[0] if isinstance(provider, tuple) else provider for provider in ort_providers_for_device(active)],
        "devices": [device.to_dict() for device in available_devices()],
    }


def empty_device_cache() -> None:
    if torch_xpu_is_available():
        empty_cache = getattr(torch.xpu, "empty_cache", None)
        if callable(empty_cache):
            empty_cache()
        return

    if torch.backends.mps.is_available():
        empty_cache = getattr(torch.mps, "empty_cache", None)
        if callable(empty_cache):
            empty_cache()


def active_device_memory_gb() -> Optional[float]:
    if torch_xpu_is_available():
        get_device_properties = getattr(torch.xpu, "get_device_properties", None)
        if callable(get_device_properties):
            try:
                props = get_device_properties(0)
                memory = getattr(props, "total_memory", None)
                if memory:
                    return round(float(memory) / 1.074e9, 2)
            except Exception as exc:
                logger.info("Unable to query Intel XPU memory: %s", exc)
    return None
