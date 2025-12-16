import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

/**
 * Props for `ImageBlock`.
 */
export type ImageBlockProps = SliceComponentProps<Content.ImageBlockSlice>;

/**
 * Component for "ImageBlock" Slices.
 */
const ImageBlock: FC<ImageBlockProps> = ({ slice }) => {
  const { image, caption, full_width } = slice.primary;

  if (!image?.url) {
    return (
      <section
        data-slice-type={slice.slice_type}
        data-slice-variation={slice.variation}
        className="py-12 bg-white"
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="p-8 text-center border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No image available.</p>
          </Card>
        </div>
      </section>
    );
  }

  const containerClass = full_width
    ? "w-full max-w-none px-0"
    : "container mx-auto px-4 max-w-4xl";

  const imageClass = full_width
    ? "w-full h-auto object-cover"
    : "w-full h-auto object-cover rounded-lg";

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-12 bg-white"
    >
      <div className={containerClass}>
        {full_width ? (
          <div className="w-full">
            <Image
              src={image.url}
              alt={image.alt || "Image"}
              width={image.dimensions?.width || 1200}
              height={image.dimensions?.height || 800}
              className={imageClass}
              priority={false}
            />
            {caption && (
              <div className="container mx-auto px-4 mt-4">
                <p className="text-sm text-[#64748b] text-center font-medium">
                  {caption}
                </p>
              </div>
            )}
          </div>
        ) : (
          <Card className="overflow-hidden border border-gray-200 shadow-sm">
            <div className="relative">
              <Image
                src={image.url}
                alt={image.alt || "Image"}
                width={image.dimensions?.width || 1200}
                height={image.dimensions?.height || 800}
                className={imageClass}
                priority={false}
              />
            </div>
            {caption && (
              <CardContent className="px-6 py-4 bg-[#f8fafc] border-t">
                <p className="text-sm text-[#64748b] text-center font-medium">
                  {caption}
                </p>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </section>
  );
};

export default ImageBlock;
