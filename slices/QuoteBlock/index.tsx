import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

/**
 * Props for `QuoteBlock`.
 */
export type QuoteBlockProps = SliceComponentProps<Content.QuoteBlockSlice>;

/**
 * Component for "QuoteBlock" Slices.
 */
const QuoteBlock: FC<QuoteBlockProps> = ({ slice }) => {
  const { quote_text, author, citation } = slice.primary;

  if (!quote_text) {
    return (
      <section
        data-slice-type={slice.slice_type}
        data-slice-variation={slice.variation}
        className="py-12 bg-white"
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="p-8 text-center border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No quote text available.</p>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-12 bg-[#f8fafc]"
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-8">
            <div className="relative">
              {/* Quote icon */}
              <div className="absolute -top-2 -left-2">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Quote className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Quote content */}
              <div className="pl-8">
                <blockquote className="text-xl md:text-2xl font-medium text-[#1e293b] leading-relaxed mb-6">
                  <div className="prose prose-lg max-w-none">
                    <PrismicRichText field={quote_text} />
                  </div>
                </blockquote>

                {/* Attribution */}
                {(author || citation) && (
                  <div className="flex items-center gap-2 text-[#64748b]">
                    <div className="w-12 h-px bg-blue-600"></div>
                    <div>
                      {author && (
                        <span className="font-semibold text-[#1e293b]">
                          {author}
                        </span>
                      )}
                      {author && citation && <span className="mx-2">•</span>}
                      {citation && <span className="text-sm">{citation}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default QuoteBlock;
