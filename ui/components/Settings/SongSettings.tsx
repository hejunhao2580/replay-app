import type { AdvancedOptions } from "../../context";
import { useReplay } from "../../context";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import { IconButton, InputBase, Slider, Switch } from "@mui/material";
import { Typography } from "@mui/material";
import "./settings.css";
import { Add, Close, Download } from "@mui/icons-material";
import Select from "react-select";
import { selectTheme } from "../Select/select.tsx";
import { groupBy, startCase } from "lodash-es";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
import { trpcReact } from "../../config/trpc.ts";
import {
  useDevice,
  useHasDownloadedSelectedStemModel,
  useHasDownloadedSelectedStemModelsList,
  useStemModelList,
} from "../../hooks/dataHooks.ts";
import { toast } from "react-toastify";
import theme from "../theme.ts";
import { useAnalytics } from "../../hooks/useAnalytics.ts";
import { ICON_SIZE } from "../CreateSong/ModelSelector/shared.tsx";
import CircularProgress from "@mui/material/CircularProgress";
type F0Method = NonNullable<AdvancedOptions["f0Method"]>;
type StemMethod = NonNullable<AdvancedOptions["stemmingMethod"]>;
type OutputFormat = NonNullable<AdvancedOptions["outputFormat"]>;
// todo figure out if theres a way to get an array of values from the ts type
interface DropdownOption<T> {
  value: T;
  label: string;
}

const F0Methods = ["pm", "harvest", "crepe", "crepe-tiny", "mangio-crepe", "mangio-crepe-tiny", "rmvpe"] as const;
const F0Labels: Record<string, string> = {
  pm: "快速音高识别",
  harvest: "高精度音高识别",
  crepe: "神经网络音高识别",
  "crepe-tiny": "轻量神经网络识别",
  "mangio-crepe": "增强神经网络识别",
  "mangio-crepe-tiny": "轻量增强识别",
  rmvpe: "推荐音高识别",
};
const F0Options: DropdownOption<F0Method>[] = F0Methods.map((l) => ({
  value: l as F0Method,
  label: F0Labels[l] || startCase(l),
}));

const OutputFormats = ["wav", "mp3_192k", "mp3_320k"];
const OutputOptions: DropdownOption<OutputFormat>[] = OutputFormats.map((l) => ({
  value: l as OutputFormat,
  label: l === "wav" ? "WAV 无损" : l === "mp3_192k" ? "MP3 192K" : "MP3 320K",
}));
const StemGroupLabels: Record<string, string> = {
  Demucs: "多轨分离",
  "MDX-Net": "快速人声分离",
  "VR Arc": "传统人声分离",
};

const OutputFormatSelector = () => {
  const options = useReplay((state) => state.options);
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);

  return (
    <SettingsEntry
      title={"输出格式"}
      description={"生成文件的格式和音质"}
      content={
        <Select<DropdownOption<OutputFormat>>
          theme={selectTheme}
          name={"outputFormat"}
          value={OutputOptions.find((l) => l.value === options.outputFormat)}
          placeholder={"选择输出格式"}
          blurInputOnSelect
          options={OutputOptions}
          onChange={(value) => {
            if (value) {
              setAdvancedOptions({ ...options, outputFormat: value.value });
            }
          }}
          styles={{
            option: (baseStyles, state) => ({
              ...baseStyles,
              color: state.isSelected ? "white" : baseStyles.color,
            }),
          }}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          onBlur={() => {}}
        />
      }
    />
  );
};

const FZeroMethod = () => {
  const options = useReplay((state) => state.options);
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);

  return (
    <SettingsEntry
      title={"音高识别"}
      description={"用于识别人声旋律高低的算法"}
      content={
        <Select<DropdownOption<F0Method>>
          theme={selectTheme}
          name={"f0Method"}
          value={F0Options.find((l) => l.value === options.f0Method)}
          placeholder={"选择音高识别方式"}
          blurInputOnSelect
          options={F0Options}
          isDisabled={options.vocalsOnly}
          onChange={(value) => {
            if (value) {
              setAdvancedOptions({ ...options, f0Method: value.value });
            }
          }}
          styles={{
            option: (baseStyles, state) => ({
              ...baseStyles,
              color: state.isSelected ? "white" : baseStyles.color,
            }),
          }}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          onBlur={() => {}}
        />
      }
    />
  );
};

const StemMethodDownloader = () => {
  const options = useReplay((state) => state.options);
  const hasDownloadedStemModel = useHasDownloadedSelectedStemModel();
  const { refetch: refetchModels } = trpcReact.listDownloadedStemModels.useQuery(undefined);
  const logEvent = useAnalytics();
  const { mutateAsync: downloadModel, isLoading: _isDownloading } = trpcReact.downloadStemModel.useMutation();
  const stemmingMethod = options.stemmingMethod;
  const { data: downloadStatus, refetch: refetchModelDownloadStatus } = trpcReact.fetchStemModelDownloadStatus.useQuery(
    stemmingMethod,
    {
      enabled: !hasDownloadedStemModel,
      refetchInterval: hasDownloadedStemModel ? false : 1000,
    },
  );

  const errorString = String(downloadStatus?.error || "");
  const isError = Boolean(errorString);

  const isDownloading = _isDownloading || Boolean(downloadStatus?.progress);
  React.useEffect(() => {
    if (isError && stemmingMethod) {
      toast.error(`${stemmingMethod} 下载失败：${errorString}`, {
        toastId: `downloadError-${stemmingMethod}`,
      });
    }
  }, [errorString, isError, stemmingMethod]);

  if (!stemmingMethod || hasDownloadedStemModel) {
    return null;
  }

  const onIconClick = async () => {
    if (!hasDownloadedStemModel) {
      logEvent({ event: "stemModelDownload", metadata: { modelId: stemmingMethod } });
      await downloadModel(stemmingMethod);
      await refetchModelDownloadStatus();
      await refetchModels();
    }
  };

  let currFilePercent = 0;
  if (downloadStatus?.fileCounts) {
    const fileCounts = downloadStatus.fileCounts;
    const { remaining, total } = fileCounts;
    const completed = total - remaining;
    const eachFilePercent = 1 / total;
    currFilePercent += eachFilePercent * completed;
    if (downloadStatus?.progress) {
      const progress = downloadStatus.progress;
      const fileByteCount = progress.total || 1;
      const currentFileDownloadedBytes = progress.loaded || 0;
      if (progress.total) {
        let thisFilePercent = Math.round((currentFileDownloadedBytes * 100) / fileByteCount);
        thisFilePercent /= eachFilePercent; // if we're downloading 3 files, then we divide it by three
        // but then we add the number we've already completed
        currFilePercent += thisFilePercent;
      }
    }
  }

  const getIcon = () => {
    if (isError) {
      return <Close onClick={onIconClick} color={"error"} sx={{ fontSize: ICON_SIZE, color: theme.colors.error }} />;
    }
    if (isDownloading) {
      return (
        <CircularProgress
          color={"primary"}
          size={ICON_SIZE}
          variant={currFilePercent ? "determinate" : "indeterminate"}
          value={currFilePercent}
        />
      );
    }
    return <Download onClick={onIconClick} sx={{ cursor: "pointer", fontSize: ICON_SIZE }} />;
  };
  return (
    <Box
      sx={{
        px: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        cursor: "pointer",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {getIcon()}
      </Box>
    </Box>
  );
};

import type { GroupHeadingProps, GroupBase } from "react-select";
import { components } from "react-select";

const groupStyles = {
  color: "white",
  background: theme.colors.slate,
  display: "flex",
  fontSize: 28,
  position: "sticky",
  top: -8,
} as const;
const GroupHeading = (
  props: GroupHeadingProps<DropdownOption<StemMethod>, false, GroupBase<DropdownOption<StemMethod>>>,
) => (
  <div style={groupStyles}>
    <components.GroupHeading {...props} style={{ margin: 0, color: "white" }} />
  </div>
);

const StemmingMethod = () => {
  const options = useReplay((state) => state.options);
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);
  const hasDownloadedStemModel = useHasDownloadedSelectedStemModel();
  const downloadedModelList = useHasDownloadedSelectedStemModelsList();
  const { data } = useStemModelList();
  const StemOptions: (DropdownOption<StemMethod> & { type: string })[] = (data || []).map((o) => {
    const hasDownloaded = downloadedModelList.find((model) => model.name === o.name);
    return {
      value: o.name,
      label: hasDownloaded ? `已下载 ${o.name}` : o.name,
      type: o.type,
    };
  });
  const groupedOptions = Object.entries(groupBy(StemOptions, (option) => option.type)).map(([key, value]) => {
    return {
      label: StemGroupLabels[key] || key,
      options: value as DropdownOption<StemMethod>[],
    };
  });
  return (
    <SettingsEntry
      title={"人声分离方式"}
      description={"用于把人声和伴奏分开的模型"}
      content={
        <Box sx={{ display: "flex", width: "100%", minWidth: 400 }}>
          <Select<DropdownOption<StemMethod>>
            theme={selectTheme}
            name={"stemMethod"}
            isDisabled={options.preStemmed}
            value={StemOptions.find((l) => l.value === options.stemmingMethod)}
            placeholder={"选择人声分离方式"}
            blurInputOnSelect
            options={groupedOptions}
            onChange={(value) => {
              if (value) {
                setAdvancedOptions({ ...options, stemmingMethod: value.value });
              }
            }}
            styles={{
              option: (baseStyles, state) => ({
                ...baseStyles,
                color: state.isSelected ? "white" : baseStyles.color,
              }),
              container: (base) => ({
                ...base,
                width: "100%",
              }),
            }}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            onBlur={() => {}}
            components={{ GroupHeading }}
          />
          {!hasDownloadedStemModel && <StemMethodDownloader />}
        </Box>
      }
    />
  );
};

const DeviceSelect = () => {
  const { data: devices } = trpcReact.devices.useQuery(undefined, { placeholderData: [] });
  const { data: deviceDetails, refetch: refetchDeviceDetails } = trpcReact.deviceDetails.useQuery(undefined, {
    placeholderData: null,
  });
  const { mutateAsync: setDevice } = trpcReact.setDevice.useMutation();
  const { data: device, refetch } = useDevice();

  const deviceOptions: DropdownOption<string>[] = (devices || []).map((l) => ({
    value: l,
    label: deviceDetails?.devices.find((detail) => detail.id === l)?.label || l.toUpperCase(),
  }));

  return (
    <SettingsEntry
      title={"推理设备"}
      description={"优先使用 Intel GPU；CPU 可用但速度较慢。"}
      content={
        <Select<DropdownOption<string>>
          theme={selectTheme}
          name={"device"}
          value={deviceOptions.find((l) => l.value === device)}
          placeholder={"选择推理设备"}
          blurInputOnSelect
          options={deviceOptions}
          onChange={async (value) => {
            if (value) {
              toast.info(`正在切换到 ${value.label}`);
              await setDevice(value.value);
              await refetch();
              await refetchDeviceDetails();
              toast.success(`已切换到 ${value.label}`);
            }
          }}
          styles={{
            option: (baseStyles, state) => ({
              ...baseStyles,
              color: state.isSelected ? "white" : baseStyles.color,
            }),
          }}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          onBlur={() => {}}
        />
      }
    />
  );
};

const SettingsSection = ({ children }: React.PropsWithChildren) => {
  return <Box sx={{ display: "flex", flexDirection: "row", gap: 8, width: "100%", py: 0.5 }}>{children}</Box>;
};
const SettingsItem = ({ children }: React.PropsWithChildren) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </Box>
  );
};
const SettingsOptionsWrapper = ({ children }: React.PropsWithChildren) => {
  return <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, width: "100%" }}>{children}</Box>;
};
const SettingsContent = ({ children }: React.PropsWithChildren) => {
  return <Box sx={{ width: "100%" }}>{children}</Box>;
};

const SettingsEntry = ({
  title,
  description,
  content,
}: {
  title: string;
  description: string;
  content: React.ReactNode;
}) => {
  return (
    <SettingsItem>
      <SettingsContent>
        <Typography>{title}</Typography>
        <Typography variant="body2" sx={{ color: "#646464", fontSize: "12px" }}>
          {description}
        </Typography>
      </SettingsContent>
      <SettingsContent>{content}</SettingsContent>
    </SettingsItem>
  );
};
const AdvancedSettings = () => {
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);
  const options = useReplay((state) => state.options);

  const [isExpanded, setIsExpanded] = useState(false);
  const handleSettingsClick = (d: React.MouseEvent) => {
    d.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  const ExpandIcon = isExpanded ? ExpandLess : ExpandMoreIcon;
  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2c2c2c",
        borderRadius: "12px",
        height: "100%",
        pt: 2,
      }}
    >
      <Typography
        sx={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", py: 1 }}
        onClick={handleSettingsClick}
      >
        高级设置
        <ExpandIcon />
      </Typography>
      {isExpanded && (
        <>
          <SettingsOptionsWrapper>
            <SettingsSection>
              <SettingsEntry
                title={"索引比例"}
                description={
                  "数值越高，越贴近所选音色；数值越低，越保留原唱细节。"
                }
                content={
                  <Slider
                    value={options.indexRatio || 0.75}
                    min={0}
                    max={1}
                    step={0.05}
                    marks
                    valueLabelDisplay="auto"
                    onChange={(e, value) =>
                      setAdvancedOptions({ ...options, indexRatio: Array.isArray(value) ? value[0] : value })
                    }
                  />
                }
              />
              <SettingsEntry
                title={"咬字保护"}
                description={
                  "可减少小音量处的杂音。数值越低保护越强，0.5 表示不额外保护。"
                }
                content={
                  <Slider
                    value={options.consonantProtection || 0.35}
                    min={0}
                    max={0.5}
                    step={0.05}
                    marks
                    valueLabelDisplay="auto"
                    onChange={(e, value) =>
                      setAdvancedOptions({ ...options, consonantProtection: Array.isArray(value) ? value[0] : value })
                    }
                  />
                }
              />
            </SettingsSection>
            <SettingsSection>
              <SettingsEntry
                title={"音量跟随"}
                description={
                  "让生成结果跟随原音频的音量变化。数值越低越贴近原音量，1 表示不调整。"
                }
                content={
                  <Slider
                    value={options.volumeEnvelope || 1.0}
                    min={0}
                    max={1.0}
                    step={0.05}
                    marks
                    valueLabelDisplay="auto"
                    onChange={(e, value) =>
                      setAdvancedOptions({ ...options, volumeEnvelope: Array.isArray(value) ? value[0] : value })
                    }
                  />
                }
              />
            </SettingsSection>
            <SettingsSection>
              <DeviceSelect />
              <OutputFormatSelector />
            </SettingsSection>
          </SettingsOptionsWrapper>
        </>
      )}
    </Box>
  );
};
export const SongSettings = () => {
  const options = useReplay((state) => state.options);
  const setModelId = useReplay((state) => state.setModelId);
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);

  const [isExpanded, setIsExpanded] = useState(false);

  const handleSettingsClick = (d: React.MouseEvent) => {
    d.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2c2c2c",
          borderRadius: "12px",
          height: "100%",
          maxHeight: isExpanded ? 9999 : "40px",
          transition: "max-height 0.2s ease-in-out",
          p: 2,
          pr: isExpanded ? 6 : 0,
          cursor: isExpanded ? undefined : "pointer",
        }}
        onClick={isExpanded ? undefined : handleSettingsClick}
      >
        {!isExpanded && <Typography>设置</Typography>}
        {isExpanded && (
          <>
            <SettingsOptionsWrapper>
              <SettingsSection>
                <SettingsEntry
                  title={"只分离人声"}
                  description={"不做音色转换，只导出分离后的人声"}
                  content={
                    <Switch
                      checked={options.vocalsOnly}
                      onChange={(e) => {
                        const vocalsOnly = e.target.checked;
                        if (vocalsOnly) {
                          setModelId(null);
                        }
                        setAdvancedOptions({
                          ...options,
                          vocalsOnly,
                          preStemmed: vocalsOnly ? false : options.preStemmed,
                        });
                      }}
                    />
                  }
                />
                <SettingsEntry
                  title={"输入已是干声"}
                  description={"如果输入本来就是没有伴奏的人声，请打开此项"}
                  content={
                    <Switch
                      checked={Boolean(options.preStemmed)}
                      onChange={(e) => {
                        const preStemmed = e.target.checked;
                        setAdvancedOptions({
                          ...options,
                          preStemmed,
                          vocalsOnly: preStemmed ? false : options.vocalsOnly,
                        });
                      }}
                    />
                  }
                />
              </SettingsSection>
              <SettingsSection>
                <SettingsEntry
                  title={"试听模式"}
                  description={"只处理音频中的 30 秒，方便快速试听效果"}
                  content={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Switch
                        checked={options.sampleMode}
                        onChange={(e) => setAdvancedOptions({ ...options, sampleMode: e.target.checked })}
                      />
                      {options.sampleMode && (
                        <InputBase
                          defaultValue={options.sampleModeStartTime}
                          sx={{
                            width: 150,
                            mx: 1,
                            px: 1,
                            mb: 0.5,
                            height: 30,
                            background: "#2c2c2c",
                            display: "flex",
                            borderRadius: "5px",
                            color: "white",
                          }}
                          inputProps={{
                            sx: { p: 0, height: 30, color: theme.colors.white, background: "#2c2c2c", borderRadius: 1 },
                            inputMode: "numeric",
                            pattern: "[0-9]*",
                            type: "number",
                          }}
                          onChange={(e) => {
                            const sampleModeStartTime = Number(e.target.value);
                            if (!Number.isNaN(sampleModeStartTime) && sampleModeStartTime > 0) {
                              setAdvancedOptions({ ...options, sampleModeStartTime });
                            }
                          }}
                          placeholder={`开始秒数`}
                        />
                      )}
                    </Box>
                  }
                />
                <SettingsEntry
                  title={"去回声和混响"}
                  description={"尽量去掉人声里的回声、房间混响和拖尾。"}
                  content={
                    <Switch
                      checked={Boolean(options.deEchoDeReverb)}
                      onChange={(e) => {
                        const deEchoDeReverb = e.target.checked;
                        setAdvancedOptions({
                          ...options,
                          deEchoDeReverb,
                        });
                      }}
                    />
                  }
                />
              </SettingsSection>
              <SettingsSection>
                <SettingsEntry
                  title={"主声音高"}
                  description={"调整人声整体音高。男声转女声通常可从 +10 附近尝试。"}
                  content={
                    <Slider
                      value={options.pitch || 0}
                      min={-30}
                      max={30}
                      disabled={options.vocalsOnly}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      onChange={(e, value) =>
                        setAdvancedOptions({ ...options, pitch: Array.isArray(value) ? value[0] : value })
                      }
                    />
                  }
                />
                <SettingsEntry
                  title={"伴奏音高"}
                  description={
                    "调整伴奏音高。人声音高变化较大时，可用它让伴奏听起来更自然。"
                  }
                  content={
                    <Slider
                      value={options.instrumentalsPitch || 0}
                      min={-30}
                      max={30}
                      disabled={options.vocalsOnly}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      onChange={(e, value) =>
                        setAdvancedOptions({ ...options, instrumentalsPitch: Array.isArray(value) ? value[0] : value })
                      }
                    />
                  }
                />
              </SettingsSection>
              <SettingsSection>
                <StemmingMethod />
              </SettingsSection>
              <SettingsSection>
                <FZeroMethod />
              </SettingsSection>
            </SettingsOptionsWrapper>
            <AdvancedSettings />
          </>
        )}
        <Box sx={{ position: "absolute", right: "0px", mr: 1 }}>
          <IconButton onClick={handleSettingsClick}>
            {isExpanded ? <Close color="disabled" /> : <Add color="disabled" />}
          </IconButton>
        </Box>
      </Box>
    </>
  );
};
