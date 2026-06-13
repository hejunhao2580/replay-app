import React from "react";
import Box from "@mui/material/Box";

import Typography from "@mui/material/Typography";
import { ModelSelectorContainer } from "./ModelSelector/ModelSelectorContainer.tsx";
import { SongSelector } from "./SongSelector";
import Button from "@mui/material/Button";
import { useReplay } from "../../context";
import { trpcReact } from "../../config/trpc";
import theme from "../theme";
import { toast } from "react-toastify";
import { SongSettings } from "../Settings/SongSettings.tsx";
import OnboardingModal from "../Onboarding/OnboardingModal";
import { useAnalytics } from "../../hooks/useAnalytics.ts";
import {
  useDevice,
  useHasDownloadedSelectedStemModel,
  useIsServerRunning,
  useJobs,
  useSelectedModel,
} from "../../hooks/dataHooks.ts";
import DynamicFeedIcon from "@mui/icons-material/DynamicFeed";
const hasSeenCpuWarningKey = "hasSeenCpuWarning";
const SubmitButton = () => {
  const modelId = useReplay((state) => state.modelId);
  const selectedModel = useSelectedModel();
  const options = useReplay((state) => state.options);
  const { data: jobs, refetch: refetchJobs } = useJobs();
  const songUrlOrFilePath = useReplay((state) => state.songUrlOrFilePath);
  const { mutateAsync, error, isLoading } = trpcReact.createSong.useMutation();
  const hasDownloadedStemModel = useHasDownloadedSelectedStemModel();
  const { data: device } = useDevice();
  const logEvent = useAnalytics();

  const isServerRunning = useIsServerRunning();
  const downloaded = selectedModel?.downloaded;
  const batchDisabled =
    !hasDownloadedStemModel ||
    !isServerRunning ||
    isLoading ||
    (!downloaded && !options.vocalsOnly) ||
    (!modelId && !options.vocalsOnly);
  const disabled = batchDisabled || !songUrlOrFilePath;

  const getButtonCopy = () => {
    if (!isServerRunning) {
      return "服务还没启动";
    }
    if (isLoading) {
      return "正在创建...";
    }
    if (!songUrlOrFilePath) {
      return "先选择音频";
    }
    if (!modelId && options.vocalsOnly) {
      return "只分离人声";
    }
    if (!modelId) {
      return "先选择音色";
    }

    if (!hasDownloadedStemModel) {
      return "请先下载人声分离模型";
    }

    if (!downloaded) {
      return "请先下载选中的音色";
    }

    const queuedJobs = (jobs || []).filter((job) => job.status === "queued");
    if (queuedJobs.length === 0) {
      return "开始生成";
    }
    return `开始生成（排队 ${queuedJobs.length} 个）`;
  };
  const checkCpuWarning = () => {
    if (device === "cpu") {
      const hasSeenCpuWarning = localStorage.getItem(hasSeenCpuWarningKey);
      if (!hasSeenCpuWarning) {
        const didConfirm = confirm(
          "当前使用的是 CPU，生成会明显变慢，也可能让电脑短时间满负载。建议使用 Intel 独立显卡或核显加速。仍然继续吗？",
        );
        if (!didConfirm) {
          toast.info("已取消本次生成");
          return false;
        }
        localStorage.setItem(hasSeenCpuWarningKey, "true");
      }
    }
    return true;
  };
  const createSongFromPath = async (path: string) => {
    if (path) {
      const effectiveOptions = { ...options, device: device || "xpu" };
      logEvent({ event: "createSong", metadata: { ...effectiveOptions } });
      const resp = await mutateAsync({ modelId, songUrlOrFilePath: path, options: effectiveOptions });
      if ("jobId" in resp) {
        console.info(`Created song with job id ${resp.jobId}`);
        toast.info("任务已加入队列");
      } else {
        toast.error("创建任务失败");
      }
    } else {
      toast.error("还没有选择音频路径");
    }
  };
  const onClick = async () => {
    if (songUrlOrFilePath) {
      if (!checkCpuWarning()) {
        return;
      }
      await createSongFromPath(songUrlOrFilePath);
      await refetchJobs();
    }
  };

  const onBatchClick = async () => {
    // batch import
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const files = target!.files;
      if (files) {
        const audioFiles = Array.from(files).filter((f) => f.type.startsWith("audio"));
        for (const file of audioFiles) {
          await createSongFromPath(file.path);
        }
      }
    };
    input.click();
  };
  return (
    <>
      <Box sx={{ display: "flex", width: "100%", flexDirection: "column", gap: 1, mt: 1 }}>
        <SongSettings />
        <Box display={"flex"}>
          <Button
            sx={{ width: "100%", borderRadius: "12px" }}
            disabled={disabled}
            onClick={onClick}
            variant={"contained"}
          >
            {getButtonCopy()}
          </Button>
          <Button
            sx={{ ml: 1, borderRadius: "12px" }}
            onClick={onBatchClick}
            disabled={batchDisabled}
            variant={"outlined"}
            title={"批量导入"}
          >
            <DynamicFeedIcon />
          </Button>
        </Box>
      </Box>
      {error && (
        <Typography variant={"body1"} sx={{ color: theme.colors.error }}>
          Error: {error.message}
        </Typography>
      )}
    </>
  );
};

const CreationFlow = () => {
  const { data: hasCompletedOnboarding, refetch } = trpcReact.hasCompletedOnboarding.useQuery(undefined, {
    placeholderData: true,
  });

  return (
    <>
      {!hasCompletedOnboarding && <OnboardingModal refetch={refetch} />}
      <SongSelector />
      <ModelSelectorContainer />
      <SubmitButton />
    </>
  );
};

export const CreateSong = () => {
  return (
    <Box
      sx={{
        zIndex: 999,
        justifyContent: "flex-start",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        background: theme.colors.background,
        overflowY: "auto",
        px: 3,
        py: 2,
        display: "flex",
        alignItems: "center",
        "&::-webkit-scrollbar": {
          width: "0.4em",
          display: "block",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: theme.palette.primary.dark,
          backgroundClip: "padding-box",
          borderRadius: 999,
          opacity: 0.5,
        },
      }}
    >
      <Box
        sx={{
          zIndex: 999,
          background: theme.colors.background,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minWidth: 480,
          maxWidth: 850,
        }}
      >
        <Typography variant={"h1"}>新建翻唱</Typography>
        <CreationFlow />
      </Box>
    </Box>
  );
};
