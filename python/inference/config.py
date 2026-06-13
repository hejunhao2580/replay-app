import logging
import os

from inference.devices import DEVICE, active_device_memory_gb, intel_gpu_names, normalize_device, ort_providers_for_device, primary_device

logger = logging.getLogger(__name__)


class Config:
    device: DEVICE

    def __init__(self):
        self.set_device(primary_device())
        logger.info("Using device: %s with ORT providers: %s", self.device, self.ort_providers)
        self.n_cpu = os.cpu_count()
        intel_names = intel_gpu_names()
        self.n_gpu = 1 if self.device == "xpu" else 0
        self.gpu_name = intel_names[0] if intel_names else None
        self.gpu_mem = active_device_memory_gb()
        self.python_cmd = "python"
        self.listen_port = 7865
        self.iscolab = False
        self.noparallel = False
        self.noautoopen = True
        self.x_pad = 1
        self.x_query = 6
        self.x_center = 38
        self.x_max = 41

    def set_device(self, device: str):
        self.device = normalize_device(device)
        self.ort_providers = ort_providers_for_device(self.device)


config = Config()
is_windows = os.name == "nt"
