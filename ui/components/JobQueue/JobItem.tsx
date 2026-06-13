import { useEffect } from "react";
import { toast } from "react-toastify";
import { trpcReact } from "../../config/trpc";
import { Box, IconButton, Typography } from "@mui/material";
import { startCase } from "lodash-es";
import type { Job } from "@replay/shared/clients/type-utils";
import { Cancel } from "@mui/icons-material";

// super hacky way of making sure we only toast once for each jobid/status combo lol
const toastedIds = new Set<string>();
const statusLabels: Record<string, string> = {
  queued: "排队中",
  processing: "生成中",
  errored: "出错",
  completed: "已完成",
  stopped: "已停止",
  unknown_job: "任务不存在",
  unknown: "未知状态",
};

export default function JobItem({
  cancelJob,
  job,
  jobNum,
}: {
  cancelJob: (jobId: string) => void;
  job: Job;
  jobNum: number;
}) {
  const { mutateAsync: saveCompletedSong } = trpcReact.saveCompletedSong.useMutation();
  const { refetch: refetchSongList, data: songList } = trpcReact.createdSongList.useQuery();
  const jobId = job.jobId;
  const error = job.error;
  const savedSong = songList?.find((song) => song.jobId === jobId);

  const status = job.status;
  const title = `${startCase(job.modelId || "")} • ${startCase(job.trackName || "")}`;

  useEffect(() => {
    (async () => {
      const toastOptions = { toastId: `${jobId}-${status}-toast` };
      if (
        jobId &&
        ["completed", "errored", "stopped"].includes(status) &&
        (!savedSong || savedSong.status !== status)
      ) {
        if (!toastedIds.has(toastOptions.toastId)) {
          if (status === "completed") {
            toast.info("生成完成！", toastOptions);
            toastedIds.add(toastOptions.toastId);
          } else if (status === "errored") {
            toast.error(`生成失败：${error}`, toastOptions);
            toastedIds.add(toastOptions.toastId);
          } else if (status === "stopped") {
            toast.error("任务已取消", toastOptions);
            toastedIds.add(toastOptions.toastId);
          }
        }
        // Update regardless of status
        if (status === "completed") {
          const didSucceedInSaving = await saveCompletedSong(jobId);
          if (!didSucceedInSaving) {
            toast.warning("生成结果保存失败，请检查本地数据目录。");
          }
          await refetchSongList();
        }
      }
    })();
  }, [error, status, saveCompletedSong, refetchSongList, savedSong, jobId]);

  if (!jobId) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", width: "100%" }}>
      <Box
        sx={{
          backgroundColor: "#2c2c2c",
          px: 1,
          py: 0.5,
          borderRadius: 2,
          minWidth: 24,
        }}
      >
        <Typography>{jobNum}</Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        {job.modelId && (
          <Typography
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: "1",
              WebkitBoxOrient: "vertical",
              fontSize: "12px",
            }}
          >
            {title}
          </Typography>
        )}
        <Typography sx={{ fontSize: "10px", color: "#646464" }}>{statusLabels[status] || startCase(status)}</Typography>
        {error && <Typography sx={{ fontSize: "10px", color: "red" }}>{startCase(error)}</Typography>}
      </Box>

      {status !== "processing" && (
        <IconButton onClick={() => cancelJob(jobId)}>
          <Cancel color="disabled" />
        </IconButton>
      )}
    </Box>
  );
}
