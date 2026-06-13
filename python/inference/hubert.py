import os
import logging
from threading import Lock

from inference.config import config

HUBERT_LOCK = Lock()
logger = logging.getLogger(__name__)


def load_fairseq_model_ensemble(checkpoint_utils, paths: list[str]):
    original_load = checkpoint_utils.torch.load

    def torch_load_with_full_checkpoint(*args, **kwargs):
        kwargs.setdefault("weights_only", False)
        try:
            return original_load(*args, **kwargs)
        except TypeError:
            kwargs.pop("weights_only", None)
            return original_load(*args, **kwargs)

    checkpoint_utils.torch.load = torch_load_with_full_checkpoint
    try:
        return checkpoint_utils.load_model_ensemble_and_task(paths)
    finally:
        checkpoint_utils.torch.load = original_load


class HubertModel:
    def __init__(
        self,
    ):
        self.hubert_model = None

    def load_model(self, weights_path: str):
        from fairseq import checkpoint_utils

        with HUBERT_LOCK:
            if self.hubert_model is not None:
                return

            hubert_path = os.path.join(weights_path, "hubert_base.pt")
            logger.info("Loading Hubert model from %s on %s", hubert_path, config.device)
            models, _, _ = load_fairseq_model_ensemble(checkpoint_utils, [hubert_path])
            model = models[0].to(config.device)
            self.hubert_model = model.float()
            self.hubert_model.eval()
            logger.info("Hubert model loaded on %s", config.device)


hubert_model = HubertModel()
