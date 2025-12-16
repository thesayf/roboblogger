import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";

/**
 * Props for `VideoBlock`.
 */
export type VideoBlockProps = SliceComponentProps<Content.VideoBlockSlice>;

/**
 * Component for "VideoBlock" Slices.
 */
const VideoBlock: FC<VideoBlockProps> = ({ slice }) => {
  const { video_type, video_id, caption } = slice.primary;

  // Extract video ID from various URL formats
  const extractVideoId = (url: string, type: string) => {
    if (!url) return null;

    switch (type) {
      case "YouTube":
        // Handle various YouTube URL formats
        const youtubeRegex =
          /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = url.match(youtubeRegex);
        return youtubeMatch ? youtubeMatch[1] : null;

      case "Vimeo":
        // Handle Vimeo URLs
        const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
        const vimeoMatch = url.match(vimeoRegex);
        return vimeoMatch ? vimeoMatch[1] : null;

      default:
        return url; // Return as-is for direct video URLs
    }
  };

  const videoId = extractVideoId(video_id || "", video_type || "YouTube");

  const renderVideo = () => {
    if (!videoId) {
      return (
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Invalid video URL</p>
          </div>
        </div>
      );
    }

    switch (video_type) {
      case "YouTube":
        return (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>
        );

      case "Vimeo":
        return (
          <div className="aspect-video">
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              title="Vimeo video player"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>
        );

      case "MP4":
        return (
          <div className="aspect-video">
            <video
              controls
              className="w-full h-full rounded-lg"
              preload="metadata"
            >
              <source src={videoId} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      default:
        return (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Unsupported video type</p>
            </div>
          </div>
        );
    }
  };

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-12 bg-white"
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            {renderVideo()}
            {caption && (
              <div className="mt-4 text-center">
                <p className="text-sm text-[#64748b] font-medium">{caption}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default VideoBlock;
