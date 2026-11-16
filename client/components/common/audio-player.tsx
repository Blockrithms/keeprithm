"use client";
import * as React from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { Play, Pause } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export interface AudioPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export const AudioPlayer = React.forwardRef<HTMLDivElement, AudioPlayerProps>(
  ({ className, src, onPlay, onPause, onEnded, ...props }, ref) => {
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [playbackRate, setPlaybackRate] = React.useState(1);

    React.useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
        if (!duration && audio.duration) {
          setDuration(audio.duration);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (onEnded) onEnded();
      };

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleEnded);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", handleEnded);
      };
    }, [duration, onEnded]);

    const togglePlayPause = () => {
      if (!audioRef.current) return;

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (onPause) onPause();
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
        if (onPlay) onPlay();
      }
    };

    const handleSliderChange = (value: number[]) => {
      if (!audioRef.current) return;
      const newTime = value[0];
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    };

    const changePlaybackRate = (rate: number) => {
      if (!audioRef.current) return;
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    };

    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg bg-secondary/50 transition-all",
          className
        )}
        {...props}
      >
        <audio ref={audioRef} src={src} />

        <Button
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={togglePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
        <div className="flex-1 flex items-center gap-1">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSliderChange}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground min-w-12 text-center">
            {formatTime(currentTime)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <p>{playbackRate}x</p>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {[0.5, 1, 1.5, 2].map((rate) => (
                <DropdownMenuItem
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={cn(
                    "cursor-pointer",
                    playbackRate === rate && "font-semibold bg-secondary"
                  )}
                >
                  {rate}x
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }
);
AudioPlayer.displayName = "AudioPlayer";
