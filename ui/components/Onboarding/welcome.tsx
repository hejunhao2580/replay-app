import { Wrapper } from "./wrapper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import React from "react";
import type { SharedProps } from "./onboarding";
import { Logo, Wordmark } from "../Logo/Logo";
import { ArrowForward } from "@mui/icons-material";

export const Welcome = (props: SharedProps) => {
  return (
    <Wrapper>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant={"h1"}>{"欢迎使用 "}</Typography>
          <Wordmark />
        </Box>
        <Typography variant={"body1"} sx={{ pb: 1 }}>
          {"开始用 AI 制作自己的翻唱"}
        </Typography>
      </Box>
      <Logo />
      <Box>
        <Button
          sx={{ mx: 2, backgroundColor: "#646464", borderRadius: 2 }}
          onClick={props.onNext}
          variant={"contained"}
          endIcon={<ArrowForward />}
        >
          继续
        </Button>
      </Box>
    </Wrapper>
  );
};
