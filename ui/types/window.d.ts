interface Window {
  paths: {
    RESOURCES_PATH: string;
  };
  config: {
    isSettings: string;
    deviceId: string;
  };
  language?: {
    get: () => Promise<"en" | "zh">;
    set: (language: "en" | "zh") => Promise<"en" | "zh">;
    onChanged: (callback: (language: "en" | "zh") => void) => () => void;
  };
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  fs: typeof import("fs/promises");
}
