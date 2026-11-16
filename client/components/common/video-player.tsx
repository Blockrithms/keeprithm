type VideoPlayerProps = {
  src: string;
  type?: string;
};

// Can be customized for better consistency over different browsers
export const VideoPlayer = ({ src, type = "video/mp4" }: VideoPlayerProps) => {
  return (
    <video controls className="w-full rounded-md">
      <source src={src} type={type} />
      Your browser does not support the video tag.
    </video>
  );
};
