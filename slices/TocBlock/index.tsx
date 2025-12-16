import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, List } from "lucide-react";

/**
 * Props for `TocBlock`.
 */
export type TocBlockProps = SliceComponentProps<Content.TocBlockSlice>;

/**
 * Component for "TocBlock" Slices.
 */
const TocBlock: FC<TocBlockProps> = ({ slice }) => {
  const { title, estimated_read_time, show_progress, sections } = slice.primary;

  if (!sections || sections.length === 0) {
    return (
      <section
        data-slice-type={slice.slice_type}
        data-slice-variation={slice.variation}
        className="py-12 bg-white"
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="p-8 text-center border-2 border-dashed border-gray-300">
            <p className="text-gray-500">
              No table of contents sections available.
            </p>
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
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <List className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-[#1e293b]">
                  {title || "Table of Contents"}
                </h3>
                {estimated_read_time && (
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-[#64748b]" />
                    <span className="text-sm text-[#64748b]">
                      {estimated_read_time} min read
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar placeholder (if show_progress is true) */}
            {show_progress && (
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full w-0 transition-all duration-300"></div>
                </div>
                <p className="text-xs text-[#64748b] mt-2">
                  Reading progress will be tracked as you scroll
                </p>
              </div>
            )}

            {/* Table of Contents */}
            <nav className="space-y-3">
              {sections.map((section, index) => (
                <div key={index} className="group">
                  <a
                    href={
                      section.anchor_link
                        ? `#${section.anchor_link}`
                        : `#section-${index}`
                    }
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group-hover:translate-x-1 transform transition-transform duration-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-[#1e293b] font-medium group-hover:text-blue-600">
                      {section.section_title}
                    </span>
                  </a>
                </div>
              ))}
            </nav>

            {/* Footer note */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-[#64748b] text-center">
                Click any section to jump directly to that part of the article
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default TocBlock;
