import os
import sysconfig


LIB_PATHS = sysconfig.get_paths()["purelib"]


def replace_in_file(path: str, replacements: list[tuple[str, str]]) -> bool:
    if not os.path.exists(path):
        return False
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    next_text = text
    for old, new in replacements:
        next_text = next_text.replace(old, new)
    if next_text != text:
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(next_text)
    return True


def repair_fairseq() -> None:
    fairseq_config = os.path.join(LIB_PATHS, "fairseq", "dataclass", "configs.py")
    fairseq_config_defaults = [
        "CommonConfig",
        "CommonEvalConfig",
        "DistributedTrainingConfig",
        "DatasetConfig",
        "OptimizationConfig",
        "CheckpointConfig",
        "FairseqBMUFConfig",
        "GenerationConfig",
        "EvalLMConfig",
        "InteractiveConfig",
        "EMAConfig",
    ]
    replacements = [
        ("metadata={help:", 'metadata={"help":'),
    ]
    replacements.extend(
        (
            f": {config_name} = {config_name}()",
            f": {config_name} = field(default_factory={config_name})",
        )
        for config_name in fairseq_config_defaults
    )
    if replace_in_file(fairseq_config, replacements):
        print(f"Fairseq repaired: {fairseq_config}")
    else:
        print(f"Fairseq config not found: {fairseq_config}")

    fairseq_init = os.path.join(LIB_PATHS, "fairseq", "dataclass", "initialize.py")
    if not os.path.exists(fairseq_init):
        return
    with open(fairseq_init, "r", encoding="utf-8") as f:
        text = f.read()
    next_text = text.replace(
        "        v = FairseqConfig.__dataclass_fields__[k].default",
        "        field = FairseqConfig.__dataclass_fields__[k]\n"
        "        v = field.default_factory() if not isinstance(field.default_factory, _MISSING_TYPE) else field.default",
    )
    if "from dataclasses import _MISSING_TYPE" not in next_text:
        next_text = next_text.replace("import logging\n", "import logging\nfrom dataclasses import _MISSING_TYPE\n")
    if next_text != text:
        with open(fairseq_init, "w", encoding="utf-8", newline="") as f:
            f.write(next_text)
        print(f"Fairseq initialize repaired: {fairseq_init}")


def repair_hydra() -> None:
    hydra_conf = os.path.join(LIB_PATHS, "hydra", "conf", "__init__.py")
    hydra_config_defaults = [
        "OverrideDirname",
        "JobConfig",
        "RunDir",
        "SweepDir",
        "HelpConf",
        "HydraHelpConf",
        "OverridesConf",
        "JobConf",
        "RuntimeConf",
    ]
    replacements = [
        (
            f": {config_name} = {config_name}()",
            f": {config_name} = field(default_factory={config_name})",
        )
        for config_name in hydra_config_defaults
    ]
    if replace_in_file(hydra_conf, replacements):
        print(f"Hydra repaired: {hydra_conf}")
    else:
        print(f"Hydra config not found: {hydra_conf}")


def main() -> None:
    repair_fairseq()
    repair_hydra()


if __name__ == "__main__":
    main()
