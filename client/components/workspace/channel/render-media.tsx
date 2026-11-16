"use client";
import { Thumbnail } from "./thumbnail";
import { MessageAttachment } from "~/types";
import {
  FileText,
  Download,
  Code,
  LucideIcon,
  FileArchive,
  FileSpreadsheet,
} from "lucide-react";
import { AudioPlayer, VideoPlayer } from "~/components/common";

type FileIconConfig = {
  icon: LucideIcon;
  bgColor: string;
};

const fileIconMap: Record<string, FileIconConfig> = {
  json: { icon: Code, bgColor: "bg-orange-600" },
  pdf: { icon: FileText, bgColor: "bg-blue-600" },
  txt: { icon: FileText, bgColor: "bg-blue-600" },
  text: { icon: FileText, bgColor: "bg-blue-600" },
  doc: { icon: FileText, bgColor: "bg-indigo-600" },
  xlsx: { icon: FileSpreadsheet, bgColor: "bg-green-600" },
  zip: { icon: FileArchive, bgColor: "bg-gray-600" },
};

export const RenderMedia = ({ file }: { file: MessageAttachment }) => {
  const isAudio = file.mimetype?.startsWith("audio/");
  const isImage = file.mimetype?.startsWith("image/");
  const isVideo = file.mimetype?.startsWith("video/");

  if (isAudio) {
    return (
      <div key={file.slackId} className="w-full md:w-[335px]">
        <AudioPlayer src={file.cloudUrl} />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div
        key={file.slackId}
        className="w-full md:min-w-[350px] lg:w-[450px] max-sm:mr-5"
      >
        <VideoPlayer src={file.cloudUrl} type={file.mimetype} />
      </div>
    );
  }

  if (isImage) {
    return <Thumbnail key={file.slackId} url={file.cloudUrl} />;
  }

  const filetype = file.filetype?.toLowerCase() || "";
  const { icon: IconComponent, bgColor } = fileIconMap[filetype] || {
    icon: FileText,
    bgColor: "bg-muted-foreground",
  };

  return (
    <div
      key={file.slackId}
      className="flex items-center gap-3 border rounded-xl bg-muted py-2 px-3 shadow-sm hover:shadow-md cursor-pointer transition"
      onClick={() => window.open(file.cloudUrl, "_blank")}
    >
      <div className={`p-2 rounded-xl ${bgColor}`}>
        <IconComponent color="white" size={20} />
      </div>

      <div className="flex flex-col flex-grow">
        <span className="text-sm font-medium truncate">{file.name}</span>
        <span className="text-xs text-muted-foreground">
          {file?.filetype?.toUpperCase() || "FILE"}
        </span>
      </div>

      <Download size={20} />
    </div>
  );
};
