import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Modal, stepLabelClasses } from "@mui/material";
import { useReplay } from "../../context";
import path from "path-browserify";
import { trpcReact } from "../../config/trpc";
import { ArrowForward } from "@mui/icons-material";
import theme from "../theme.ts";
import { useDevice, useModelDownloadStatus, useModelList } from "../../hooks/dataHooks.ts";

const steps = ["添加音频", "选择音色", "高级设置", "系统要求", "开始生成"];
const SysReqStep = () => {
  const { data: device } = useDevice();
  return (
    <>
      <Box key={2} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2">
          {
            "Replay 至少需要 8GB 内存，建议 16GB 或更高。内存较小时也能使用，但可能更慢，长音频还可能失败。"
          }
        </Typography>
        <Typography variant="body2">
          {
            "为了加快生成速度，建议使用 Intel GPU 加速。如果没有可用显卡，也可以用 CPU 模式，只是会慢很多。"
          }
        </Typography>
        {device === "cpu" && (
          <Typography variant="body2" fontWeight={"bold"}>
            {
              "当前检测到使用 CPU。你仍然可以生成歌曲，但处理时电脑可能会明显卡顿。"
            }
          </Typography>
        )}
        {device && ["mps", "xpu"].includes(device) && (
          <Typography variant="body2" fontWeight={"bold"}>
            {device === "xpu" ? "已检测到 Intel GPU，加速已准备好。" : "已检测到 Apple GPU，加速已准备好。"}
          </Typography>
        )}
      </Box>
    </>
  );
};
const stepContent = [
  <Box key={0} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Typography variant="body2">{"欢迎使用！我们先生成第一首歌。"}</Typography>
    <Typography variant="body2">
      {
        "第一步先选择音频来源。可以用本地音频、YouTube 链接，也可以直接录一段自己的声音。录音更适合做说话声音转换。"
      }
    </Typography>
    <Typography variant="body2">{"点击下一步后，我们会帮你加载一段示例音频。"}</Typography>
  </Box>,
  <Box key={1} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Typography variant="body2">
      {
        "接下来选择要转换成的音色。收藏里已经放了一些测试过的模型，你也可以从模型库里下载更多音色。"
      }
    </Typography>
    <Typography variant="body2">
      {"注意：不同模型质量差异较大，有些模型可能效果一般，甚至无法正常生成。"}
    </Typography>
    <Typography variant="body2">{"点击下一步后，我们会先帮你选一个示例音色。"}</Typography>
  </Box>,
  <Box key={2} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Typography variant="body2">
      {
        "默认设置通常最稳。如果你想微调效果，可以在高级设置里改音高、人声分离方式和其他参数。"
      }
    </Typography>
    <Typography variant="body2">
      {
        "你也可以导入自己的 RVC 音色模型，让软件使用本地模型生成。"
      }
    </Typography>
  </Box>,
  <SysReqStep key={"sys-req"} />,
  <Box key={3} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Typography variant="body2">{"准备好了！"}</Typography>
    <Typography variant="body2">
      {
        "你可以连续添加多个任务，在左下角查看进度。生成完成后，作品会出现在左侧列表中。"
      }
    </Typography>
  </Box>,
];

const DEFAULT_MODEL_ID = "kanye";

export default function OnboardingModal({ refetch }: { refetch: () => void }) {
  const [activeStep, setActiveStep] = useState(0);
  const selectSong = useReplay((state) => state.setSongUrlOrFilePath);
  const setModelId = useReplay((state) => state.setModelId);
  const { data: models, refetch: refetchModels } = useModelList();

  const { mutateAsync: downloadModel, isLoading: isDownloadingModel } = trpcReact.downloadSpecificModel.useMutation();
  const { mutateAsync: setHasCompletedOnboarding } = trpcReact.setHasCompletedOnboarding.useMutation();

  const model = models?.find((l) => l.id === DEFAULT_MODEL_ID);
  const { data: downloadStatus } = useModelDownloadStatus(model);
  const hasDownloaded = Boolean(model?.downloaded);

  const isFinalStep = activeStep === steps.length - 1;
  const handleNext = async () => {
    if (activeStep === 0) {
      selectSong(path.join(window.paths.RESOURCES_PATH, "assets", "WelcomeToReplay.mp3"));
    } else if (activeStep === 1) {
      setModelId(DEFAULT_MODEL_ID);
      if (!hasDownloaded && !isDownloadingModel) {
        downloadModel({ id: DEFAULT_MODEL_ID }).then(() => {
          refetchModels();
        });
      }
    } else if (isFinalStep) {
      await setHasCompletedOnboarding(true);
      refetch();
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDismiss = async () => {
    await setHasCompletedOnboarding(true);
    refetch();
  };
  const getDownloadProgress = () => {
    const progress = downloadStatus?.progress;
    if (!progress || !progress?.loaded) {
      return "";
    }
    const fileByteCount = progress?.total || 1;
    const currentFileDownloadedBytes = progress?.loaded || 0;
    const currFilePercent = Math.round((currentFileDownloadedBytes * 100) / fileByteCount);
    return ` (${currFilePercent}%)`;
  };
  return (
    <Modal open={true} onClose={() => {}} aria-labelledby="modal-song-edit" aria-describedby="modal-edit_song-details">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: 650,
          bgcolor: "#3c3c3c",
          borderRadius: "12px",
          boxShadow: 24,
          px: 4,
          py: 2,
          gap: 4,
          color: "black",
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => {
              return (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      [`& .${stepLabelClasses.label}`]: {
                        [`&.${stepLabelClasses.completed}`]: {
                          color: "rgb(255, 255, 255, 0.3)",
                        },
                        [`&.${stepLabelClasses.active}`]: {
                          color: theme.colors.mayaBlue,
                        },

                        color: "rgb(255, 255, 255, 0.9)",
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>

          <Box sx={{ mt: 2, mb: 1 }}>{stepContent[activeStep]}</Box>
          <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
            <Button onClick={handleDismiss} sx={{ mr: 1, color: theme.colors.lightGray }}>
              暂时跳过
            </Button>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1, borderRadius: 2, backgroundColor: "#646464" }}
              variant="contained"
            >
              上一步
            </Button>
            <Box sx={{ flex: "1 1 auto" }} />
            <Button onClick={handleNext} variant="contained" sx={{ borderRadius: 2 }} endIcon={<ArrowForward />}>
              {isFinalStep ? (isDownloadingModel ? `正在下载模型${getDownloadProgress()}` : "完成") : "下一步"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
