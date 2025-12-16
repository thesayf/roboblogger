import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";

/**
 * Props for `TextBlock`.
 */
export type TextBlockProps = SliceComponentProps<Content.TextBlockSlice>;

/**
 * Component for "TextBlock" Slices.
 */
const TextBlock: FC<TextBlockProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-8"
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <div className="text-lg leading-relaxed text-[#1e293b]">
            <PrismicRichText field={slice.primary.content} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TextBlock;
