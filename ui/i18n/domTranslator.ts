type AppLanguage = "en" | "zh";

interface TranslationEntry {
  zh: string;
  en: string;
  aliases?: string[];
}

const entries: TranslationEntry[] = [
  { zh: "本软件", en: "Replay" },
  { zh: "本软件标志", en: "Replay logo", aliases: ["Replay 标志"] },
  { zh: "人工智能服务更新", en: "AI Service Update", aliases: ["AI 服务更新"] },
  { zh: "下载人工智能数据", en: "Download AI Data", aliases: ["下载 AI 数据"] },
  { zh: "开始用人工智能制作自己的翻唱", en: "Start making your own AI cover", aliases: ["开始用 AI 制作自己的翻唱"] },
  { zh: "欢迎使用！我们先生成第一首歌。", en: "Welcome! Let's create your first song." },
  {
    zh: "第一步先选择音频来源。可以用本地音频、视频链接，也可以直接录一段自己的声音。录音更适合做说话声音转换。",
    en: "First, choose an audio source. You can use a local file, a video link, or record your own voice. Recording works especially well for spoken voice conversion.",
    aliases: [
      "第一步先选择音频来源。可以用本地音频、YouTube 链接，也可以直接录一段自己的声音。录音更适合做说话声音转换。",
    ],
  },
  { zh: "点击下一步后，我们会帮你加载一段示例音频。", en: "After you click Next, we'll load a sample audio file for you." },
  {
    zh: "接下来选择要转换成的音色。收藏里已经放了一些测试过的模型，你也可以从模型库里下载更多音色。",
    en: "Next, choose the voice you want to convert to. Favorites include a few tested models, and you can download more voices from the model library.",
  },
  {
    zh: "注意：不同模型质量差异较大，有些模型可能效果一般，甚至无法正常生成。",
    en: "Note: Model quality varies a lot. Some models may sound rough or fail to generate correctly.",
  },
  { zh: "点击下一步后，我们会先帮你选一个示例音色。", en: "After you click Next, we'll select a sample voice for you." },
  {
    zh: "默认设置通常最稳。如果你想微调效果，可以在高级设置里改音高、人声分离方式和其他参数。",
    en: "The default settings are usually the most reliable. You can fine-tune pitch, vocal separation, and other options in Advanced Settings.",
  },
  { zh: "你也可以导入自己的音色模型，让软件使用本地模型生成。", en: "You can also import your own RVC voice model and generate with a local model.", aliases: ["你也可以导入自己的 RVC 音色模型，让软件使用本地模型生成。"] },
  { zh: "准备好了！", en: "You're ready!" },
  {
    zh: "你可以连续添加多个任务，在左下角查看进度。生成完成后，作品会出现在左侧列表中。",
    en: "You can queue multiple jobs and track progress in the lower-left corner. Finished songs will appear in the left list.",
  },
  {
    zh: "本软件至少需要 8GB 内存，建议 16GB 或更高。内存较小时也能使用，但可能更慢，长音频还可能失败。",
    en: "Replay needs at least 8 GB of RAM, and 16 GB or more is recommended. Lower memory may still work, but it can be slower and long audio may fail.",
    aliases: ["Replay 至少需要 8GB 内存，建议 16GB 或更高。内存较小时也能使用，但可能更慢，长音频还可能失败。"],
  },
  {
    zh: "为了加快生成速度，建议使用英特尔显卡加速。如果没有可用显卡，也可以用处理器模式，只是会慢很多。",
    en: "For faster generation, Intel GPU acceleration is recommended. CPU mode also works if no GPU is available, but it is much slower.",
    aliases: ["为了加快生成速度，建议使用 Intel GPU 加速。如果没有可用显卡，也可以用 CPU 模式，只是会慢很多。"],
  },
  {
    zh: "当前检测到使用处理器。你仍然可以生成歌曲，但处理时电脑可能会明显卡顿。",
    en: "CPU mode is currently detected. You can still generate songs, but your computer may feel sluggish while processing.",
    aliases: ["当前检测到使用 CPU。你仍然可以生成歌曲，但处理时电脑可能会明显卡顿。"],
  },
  {
    zh: "已检测到英特尔显卡，加速已准备好。",
    en: "Intel GPU detected. Acceleration is ready.",
    aliases: ["已检测到 Intel GPU，加速已准备好。"],
  },
  { zh: "已检测到苹果显卡，加速已准备好。", en: "Apple GPU detected. Acceleration is ready.", aliases: ["已检测到 Apple GPU，加速已准备好。"] },
  { zh: "添加音频", en: "Add Audio" },
  { zh: "选择音色", en: "Choose Voice" },
  { zh: "高级设置", en: "Advanced Settings" },
  { zh: "系统要求", en: "System Requirements" },
  { zh: "开始生成", en: "Generate" },
  { zh: "暂时跳过", en: "Skip for Now" },
  { zh: "上一步", en: "Back" },
  { zh: "下一步", en: "Next" },
  { zh: "完成", en: "Done" },
  { zh: "继续", en: "Continue" },
  { zh: "新建翻唱", en: "New Cover" },
  { zh: "我的作品", en: "My Songs" },
  { zh: "还没有作品", en: "No songs yet" },
  { zh: "加入本软件社区", en: "Join the Replay Community", aliases: ["加入 Replay 社区"] },
  { zh: "按日期排序", en: "Sort by Date" },
  { zh: "按音色分组", en: "Group by Voice" },
  { zh: "按歌曲分组", en: "Group by Song" },
  { zh: "排序方式", en: "Sort By" },
  { zh: "选择音频", en: "Choose Audio" },
  { zh: "已选择音频：", en: "Selected audio:" },
  { zh: "选择音频，或拖到这里", en: "Choose audio or drop it here" },
  { zh: "粘贴视频链接", en: "Paste YouTube link", aliases: ["粘贴 YouTube 链接"] },
  { zh: "或者", en: "or" },
  { zh: "录一段自己的声音", en: "Record your own voice" },
  { zh: "麦克风", en: "Microphone" },
  { zh: "保存录音", en: "Save recording" },
  { zh: "开始录音", en: "Start recording" },
  { zh: "暂停或继续", en: "Pause or resume" },
  { zh: "继续录音", en: "Resume recording" },
  { zh: "暂停录音", en: "Pause recording" },
  { zh: "丢弃", en: "Discard" },
  { zh: "丢弃录音", en: "Discard recording" },
  { zh: "录音音频", en: "Recorded audio" },
  { zh: "网络链接", en: "Web link" },
  { zh: "文件为空", en: "File is empty" },
  { zh: "批量导入", en: "Batch Import" },
  { zh: "从列表选择音色，或拖入本地音色模型", en: "Choose a voice from the list or drop a local RVC model", aliases: ["从列表选择音色，或拖入本地 RVC 模型"] },
  { zh: "没有找到 .pth 音色模型文件", en: "No .pth voice model file found" },
  { zh: "开始批量导入", en: "Starting batch import" },
  { zh: "删除模型", en: "Delete Model" },
  { zh: "在文件夹中显示", en: "Show in Folder" },
  { zh: "未下载", en: "Not Downloaded" },
  { zh: "已下载", en: "Downloaded" },
  { zh: "下载中...", en: "Downloading..." },
  { zh: "文件", en: "File" },
  { zh: "分类", en: "Category" },
  { zh: "大小", en: "Size" },
  { zh: "训练轮数", en: "Training Epochs" },
  { zh: "收藏", en: "Favorites" },
  { zh: "精选", en: "Featured" },
  { zh: "全部", en: "All" },
  { zh: "音乐人", en: "Musician" },
  { zh: "公众人物", en: "Public Figure" },
  { zh: "游戏角色", en: "Video Game Character" },
  { zh: "虚构角色", en: "Fictional Character" },
  { zh: "知名人物", en: "Notable Person" },
  { zh: "动画角色", en: "Anime Character" },
  { zh: "娱乐", en: "Entertainment" },
  { zh: "未分类", en: "Uncategorized" },
  { zh: "搜索音色模型", en: "Search voice models" },
  { zh: "设置", en: "Settings" },
  { zh: "WAV 无损", en: "WAV Lossless" },
  { zh: "输出格式", en: "Output Format" },
  { zh: "生成文件的格式和音质", en: "Generated file format and quality" },
  { zh: "选择输出格式", en: "Choose output format" },
  { zh: "音高识别", en: "Pitch Detection" },
  { zh: "用于识别人声旋律高低的算法", en: "Algorithm for detecting vocal melody pitch" },
  { zh: "选择音高识别方式", en: "Choose pitch detection method" },
  { zh: "快速音高识别", en: "Fast Pitch Detection" },
  { zh: "高精度音高识别", en: "High-Precision Pitch Detection" },
  { zh: "神经网络音高识别", en: "Neural Pitch Detection" },
  { zh: "轻量神经网络识别", en: "Lightweight Neural Detection" },
  { zh: "增强神经网络识别", en: "Enhanced Neural Detection" },
  { zh: "轻量增强识别", en: "Lightweight Enhanced Detection" },
  { zh: "推荐音高识别", en: "Recommended Pitch Detection" },
  { zh: "多轨分离", en: "Multi-track Separation" },
  { zh: "快速人声分离", en: "Fast Vocal Separation" },
  { zh: "传统人声分离", en: "Classic Vocal Separation" },
  { zh: "人声分离方式", en: "Vocal Separation Method" },
  { zh: "用于把人声和伴奏分开的模型", en: "Model used to split vocals and accompaniment" },
  { zh: "选择人声分离方式", en: "Choose vocal separation method" },
  { zh: "推理设备", en: "Inference Device" },
  { zh: "优先使用英特尔显卡；处理器可用但速度较慢。", en: "Intel GPU is preferred; CPU works but is slower.", aliases: ["优先使用 Intel GPU；CPU 可用但速度较慢。"] },
  { zh: "选择推理设备", en: "Choose inference device" },
  { zh: "索引比例", en: "Index Ratio" },
  { zh: "数值越高，越贴近所选音色；数值越低，越保留原唱细节。", en: "Higher values sound closer to the selected voice; lower values keep more original detail." },
  { zh: "咬字保护", en: "Consonant Protection" },
  { zh: "可减少小音量处的杂音。数值越低保护越强，0.5 表示不额外保护。", en: "Reduces noise in quiet parts. Lower values protect more strongly; 0.5 means no extra protection." },
  { zh: "音量跟随", en: "Volume Envelope" },
  { zh: "让生成结果跟随原音频的音量变化。数值越低越贴近原音量，1 表示不调整。", en: "Makes the output follow the original volume changes. Lower values follow the original more closely; 1 means no adjustment." },
  { zh: "只分离人声", en: "Vocals Only" },
  { zh: "不做音色转换，只导出分离后的人声", en: "Only export separated vocals without voice conversion" },
  { zh: "输入已是干声", en: "Input is already dry vocals" },
  { zh: "如果输入本来就是没有伴奏的人声，请打开此项", en: "Turn this on if your input is already vocals without accompaniment" },
  { zh: "试听模式", en: "Preview Mode" },
  { zh: "只处理音频中的 30 秒，方便快速试听效果", en: "Process only 30 seconds for a quick preview" },
  { zh: "开始秒数", en: "Start second" },
  { zh: "去回声和混响", en: "Remove Echo and Reverb" },
  { zh: "尽量去掉人声里的回声、房间混响和拖尾。", en: "Try to remove echo, room reverb, and tails from vocals." },
  { zh: "主声音高", en: "Vocal Pitch" },
  { zh: "调整人声整体音高。男声转女声通常可从 +10 附近尝试。", en: "Adjust the overall vocal pitch. For male-to-female conversion, try around +10." },
  { zh: "伴奏音高", en: "Instrumental Pitch" },
  { zh: "调整伴奏音高。人声音高变化较大时，可用它让伴奏听起来更自然。", en: "Adjust instrumental pitch. Use it when vocal pitch changes are large to keep the accompaniment natural." },
  { zh: "服务还没启动", en: "Service is not running" },
  { zh: "正在创建...", en: "Creating..." },
  { zh: "先选择音频", en: "Choose audio first" },
  { zh: "只分离人声", en: "Separate vocals only" },
  { zh: "先选择音色", en: "Choose a voice first" },
  { zh: "请先下载人声分离模型", en: "Download the vocal separation model first" },
  { zh: "请先下载选中的音色", en: "Download the selected voice first" },
  { zh: "开始生成", en: "Start Generating" },
  { zh: "当前使用的是处理器，生成会明显变慢，也可能让电脑短时间满负载。建议使用英特尔独立显卡或核显加速。仍然继续吗？", en: "You are using CPU mode. Generation will be much slower and may briefly max out your computer. Intel discrete or integrated GPU acceleration is recommended. Continue anyway?", aliases: ["当前使用的是 CPU，生成会明显变慢，也可能让电脑短时间满负载。建议使用 Intel 独立显卡或核显加速。仍然继续吗？"] },
  { zh: "已取消本次生成", en: "Generation canceled" },
  { zh: "任务已加入队列", en: "Job added to queue" },
  { zh: "创建任务失败", en: "Failed to create job" },
  { zh: "还没有选择音频路径", en: "No audio path selected" },
  { zh: "排队中", en: "Queued" },
  { zh: "生成中", en: "Generating" },
  { zh: "出错", en: "Error" },
  { zh: "已完成", en: "Completed" },
  { zh: "已停止", en: "Stopped" },
  { zh: "任务不存在", en: "Job not found" },
  { zh: "未知状态", en: "Unknown status" },
  { zh: "生成完成！", en: "Generation complete!" },
  { zh: "任务已取消", en: "Job canceled" },
  { zh: "任务已取消。", en: "Job canceled." },
  { zh: "当前没有任务", en: "No active jobs" },
  { zh: "正在取消任务，当前步骤结束后会停止。", en: "Canceling job. It will stop after the current step." },
  { zh: "任务已取消，当前步骤结束后会停止。", en: "Job canceled. It will stop after the current step." },
  { zh: "生成结果保存失败，请检查本地数据目录。", en: "Failed to save generated result. Check the local data directory." },
  { zh: "生成作品", en: "Generated Song" },
  { zh: "用同样设置再做一版", en: "Create Another with Same Settings" },
  { zh: "处理耗时", en: "Processing time" },
  { zh: "试听模式", en: "Preview mode" },
  { zh: "主音高", en: "Vocal pitch" },
  { zh: "伴奏音高", en: "Instrumental pitch" },
  { zh: "仅处理人声", en: "Vocals only" },
  { zh: "已提前分离音轨", en: "Pre-separated tracks" },
  { zh: "音高算法", en: "Pitch algorithm" },
  { zh: "索引强度", en: "Index strength" },
  { zh: "转换音色：", en: "Voice:" },
  { zh: "由", en: "by" },
  { zh: "音量", en: "Volume" },
  { zh: "源音轨", en: "Source Tracks" },
  { zh: "原始歌曲", en: "Original Song" },
  { zh: "原始人声", en: "Original Vocals" },
  { zh: "去混响前人声", en: "Vocals Before Reverb Removal" },
  { zh: "转换后人声", en: "Converted Vocals" },
  { zh: "伴奏", en: "Instrumental" },
  { zh: "编辑作品信息", en: "Edit Song Info" },
  { zh: "作品名称", en: "Song Name" },
  { zh: "取消", en: "Cancel" },
  { zh: "保存", en: "Save" },
  { zh: "编辑名称", en: "Edit Name" },
  { zh: "删除作品", en: "Delete Song" },
  { zh: "保存到下载文件夹", en: "Save to Downloads" },
  { zh: "正在保存到“下载”文件夹", en: "Saving to Downloads" },
  { zh: "已保存到“下载”文件夹", en: "Saved to Downloads" },
  { zh: "保存到“下载”文件夹失败", en: "Failed to save to Downloads" },
  { zh: "下载位置", en: "Download Location" },
  { zh: "当前数据目录", en: "Current Data Directory" },
  { zh: "重新选择", en: "Choose Again" },
  { zh: "服务端版本跟随界面版本", en: "Backend Version Follows App Version" },
  { zh: "关闭匿名统计", en: "Disable Anonymous Analytics" },
  { zh: "仅用于收集匿名崩溃日志和基本使用情况，方便排查问题。", en: "Only anonymous crash logs and basic usage data are collected to help troubleshoot issues." },
  { zh: "链接已复制", en: "Link copied" },
  { zh: "复制链接失败", en: "Failed to copy link" },
  { zh: "作品上传成功", en: "Song uploaded" },
  { zh: "作品上传失败", en: "Song upload failed" },
  { zh: "上传中...", en: "Uploading..." },
  { zh: "分享作品", en: "Share Song" },
  { zh: "总进度：", en: "Total progress:" },
  { zh: "文件", en: "File" },
  { zh: "检测到服务端有更新。如果暂时不想更新，可以在设置里固定当前服务端版本。", en: "A backend service update is available. If you don't want to update yet, pin the current backend version in Settings." },
  { zh: "本软件需要下载基础模型和推理服务后才能生成音频。文件较大，下载时间取决于你的网络情况。", en: "Replay needs to download base models and the inference service before it can generate audio. The files are large, and download time depends on your network.", aliases: ["Replay 需要下载基础模型和推理服务后才能生成音频。文件较大，下载时间取决于你的网络情况。"] },
  { zh: "重新下载", en: "Download Again" },
  { zh: "开始下载", en: "Start Download" },
  { zh: "服务还没启动", en: "Service is not running" },
  { zh: "后台服务状态未知...", en: "Unknown backend service status..." },
  { zh: "正在启动后台服务...", en: "Starting backend service..." },
  { zh: "处理器（处理器，速度较慢）", en: "CPU (slower)", aliases: ["CPU（处理器，速度较慢）"] },
  { zh: "英特尔显卡", en: "Intel GPU", aliases: ["Intel GPU"] },
  { zh: "苹果显卡", en: "Apple GPU", aliases: ["Apple GPU"] },
  { zh: "处理器", en: "CPU", aliases: ["CPU"] },
];

const attributeNames = ["aria-label", "alt", "placeholder", "title", "value"];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasText = (value: string | null | undefined) => Boolean(value && value.trim());

const replacementSets = {
  en: entries.flatMap((entry) =>
    [entry.zh, ...(entry.aliases || [])].map((from) => ({
      from,
      to: entry.en,
    })),
  ),
  zh: entries.flatMap((entry) =>
    [entry.en, ...(entry.aliases || [])].map((from) => ({
      from,
      to: entry.zh,
    })),
  ),
};

const patternSets = {
  en: [
    { from: /开始生成（排队 (\d+) 个）/g, to: "Start Generating ($1 queued)" },
    { from: /(\d+) 个任务正在排队/g, to: "$1 jobs queued" },
    { from: /(\d+) 个任务出错/g, to: "$1 jobs failed" },
    { from: /生成失败：(.+)/g, to: "Generation failed: $1" },
    { from: /取消任务失败：(.+)/g, to: "Failed to cancel job: $1" },
    { from: /已添加音色：(.+)/g, to: "Voice added: $1" },
    { from: /添加模型失败：(.+)/g, to: "Failed to add model: $1" },
    { from: /正在删除 (.+)/g, to: "Deleting $1" },
    { from: /已删除 (.+)/g, to: "Deleted $1" },
    { from: /(.+) 下载失败：(.+)/g, to: "$1 download failed: $2" },
    { from: /正在切换到 (.+)/g, to: "Switching to $1" },
    { from: /已切换到 (.+)/g, to: "Switched to $1" },
    { from: /正在从 (.+) 导入/g, to: "Importing from $1" },
    { from: /正在下载模型(.+)/g, to: "Downloading model $1" },
    { from: /文件 (\d+) \/ (\d+)/g, to: "File $1 / $2" },
    { from: /出错：(.+)/g, to: "Error: $1" },
    { from: /录音转换为 (.+)/g, to: "Recording converted with $1" },
    { from: /已下载 (.+)/g, to: "Downloaded $1" },
    { from: /已选择音频：(.+)/g, to: "Selected audio: $1" },
    { from: /处理耗时 (\d+)分 (\d+)秒/g, to: "Processing time $1m $2s" },
    { from: /处理耗时 (\d+)秒/g, to: "Processing time $1s" },
    { from: /试听模式（30 秒）/g, to: "Preview mode (30s)" },
    { from: /主音高：(.+)/g, to: "Vocal pitch: $1" },
    { from: /伴奏音高：(.+)/g, to: "Instrumental pitch: $1" },
    { from: /音高算法：(.+)/g, to: "Pitch algorithm: $1" },
    { from: /索引强度：(.+)/g, to: "Index strength: $1" },
    { from: /(\d+)分 (\d+)秒/g, to: "$1m $2s" },
    { from: /(\d+)秒/g, to: "$1s" },
  ],
  zh: [
    { from: /Start Generating \((\d+) queued\)/g, to: "开始生成（排队 $1 个）" },
    { from: /(\d+) jobs queued/g, to: "$1 个任务正在排队" },
    { from: /(\d+) jobs failed/g, to: "$1 个任务出错" },
    { from: /Generation failed: (.+)/g, to: "生成失败：$1" },
    { from: /Failed to cancel job: (.+)/g, to: "取消任务失败：$1" },
    { from: /Voice added: (.+)/g, to: "已添加音色：$1" },
    { from: /Failed to add model: (.+)/g, to: "添加模型失败：$1" },
    { from: /Deleting (.+)/g, to: "正在删除 $1" },
    { from: /Deleted (.+)/g, to: "已删除 $1" },
    { from: /(.+) download failed: (.+)/g, to: "$1 下载失败：$2" },
    { from: /Switching to (.+)/g, to: "正在切换到 $1" },
    { from: /Switched to (.+)/g, to: "已切换到 $1" },
    { from: /Importing from (.+)/g, to: "正在从 $1 导入" },
    { from: /Downloading model (.+)/g, to: "正在下载模型$1" },
    { from: /File (\d+) \/ (\d+)/g, to: "文件 $1 / $2" },
    { from: /Error: (.+)/g, to: "出错：$1" },
    { from: /Recording converted with (.+)/g, to: "录音转换为 $1" },
    { from: /Downloaded (.+)/g, to: "已下载 $1" },
    { from: /Selected audio: (.+)/g, to: "已选择音频：$1" },
    { from: /Processing time (\d+)m (\d+)s/g, to: "处理耗时 $1分 $2秒" },
    { from: /Processing time (\d+)s/g, to: "处理耗时 $1秒" },
    { from: /Preview mode \(30s\)/g, to: "试听模式（30 秒）" },
    { from: /Vocal pitch: (.+)/g, to: "主音高：$1" },
    { from: /Instrumental pitch: (.+)/g, to: "伴奏音高：$1" },
    { from: /Pitch algorithm: (.+)/g, to: "音高算法：$1" },
    { from: /Index strength: (.+)/g, to: "索引强度：$1" },
    { from: /(\d+)m (\d+)s/g, to: "$1分 $2秒" },
    { from: /(\d+)s/g, to: "$1秒" },
    { from: /\bAI\b/g, to: "人工智能" },
    { from: /\bRVC\b/g, to: "音色转换" },
    { from: /\bYouTube\b/g, to: "视频" },
    { from: /\bCPU\b/g, to: "处理器" },
    { from: /\bIntel GPU\b/g, to: "英特尔显卡" },
    { from: /\bApple GPU\b/g, to: "苹果显卡" },
    { from: /\bReplay\b/g, to: "本软件" },
  ],
};

const compareLengthDesc = (a: { from: string }, b: { from: string }) => b.from.length - a.from.length;

export const translateText = (value: string, language: AppLanguage) => {
  if (!hasText(value)) {
    return value;
  }

  let nextValue = value;
  for (const { from, to } of [...replacementSets[language]].sort(compareLengthDesc)) {
    if (from && nextValue.includes(from)) {
      nextValue = nextValue.replace(new RegExp(escapeRegExp(from), "g"), to);
    }
  }
  for (const { from, to } of patternSets[language]) {
    nextValue = nextValue.replace(from, to);
  }
  return nextValue;
};

const shouldSkipTextNode = (node: Text) => {
  const parent = node.parentElement;
  if (!parent) {
    return true;
  }
  const tagName = parent.tagName.toLowerCase();
  return ["script", "style", "textarea", "code", "pre"].includes(tagName);
};

const translateTextNode = (node: Text, language: AppLanguage) => {
  if (shouldSkipTextNode(node)) {
    return;
  }
  const current = node.nodeValue || "";
  const next = translateText(current, language);
  if (next !== current) {
    node.nodeValue = next;
  }
};

const translateElementAttributes = (element: Element, language: AppLanguage) => {
  for (const attribute of attributeNames) {
    const current = element.getAttribute(attribute);
    if (!hasText(current)) {
      continue;
    }
    const next = translateText(current || "", language);
    if (next !== current) {
      element.setAttribute(attribute, next);
    }
  }
};

export const translateDom = (root: ParentNode, language: AppLanguage) => {
  if (root instanceof Element) {
    translateElementAttributes(root, language);
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }
  textNodes.forEach((node) => translateTextNode(node, language));

  if (root instanceof Element || root instanceof Document) {
    const elements = "querySelectorAll" in root ? root.querySelectorAll("*") : [];
    elements.forEach((element) => translateElementAttributes(element, language));
  }
};

export const installDomTranslator = (language: AppLanguage) => {
  let frame = 0;
  const apply = () => {
    if (frame) {
      return;
    }
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      translateDom(document.body, language);
    });
  };

  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: attributeNames,
    characterData: true,
    childList: true,
    subtree: true,
  });

  return () => {
    if (frame) {
      window.cancelAnimationFrame(frame);
    }
    observer.disconnect();
  };
};
