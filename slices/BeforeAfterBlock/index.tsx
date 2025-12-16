import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

/**
 * Props for `BeforeAfterBlock`.
 */
export type BeforeAfterBlockProps =
  SliceComponentProps<any>;

/**
 * Component for "BeforeAfterBlock" Slices.
 */
const BeforeAfterBlock: FC<BeforeAfterBlockProps> = ({ slice }) => {
  const { title, before_section, layout } = slice.primary;

  // Since after_section schema is empty, we'll use a simpler approach
  // showing only before_section data in a styled layout
  const renderContent = () => {
    switch (layout) {
      case "comparison-table":
        return (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-[#f8fafc]">
                    <th className="text-left py-4 px-6 font-semibold text-[#1e293b]">
                      Section
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-[#1e293b]">
                      Content
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {before_section.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b last:border-b-0 hover:bg-[#f8fafc] transition-colors"
                    >
                      <td className="py-4 px-6 font-medium text-[#1e293b]">
                        {item.before_section || `Item ${index + 1}`}
                      </td>
                      <td className="py-4 px-6">
                        <div className="prose prose-sm text-[#64748b]">
                          <PrismicRichText field={item.before_content} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );

      case "stacked":
        return (
          <div className="space-y-8">
            {before_section.map((item: any, index: number) => (
              <Card key={index} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {item.before_image?.url && (
                    <div className="aspect-video w-full overflow-hidden">
                      <Image
                        src={item.before_image.url}
                        alt={item.before_image.alt || "Content image"}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    {item.before_section && (
                      <h3 className="text-lg font-semibold text-[#1e293b] mb-3">
                        {item.before_section}
                      </h3>
                    )}
                    <div className="prose prose-sm text-[#64748b]">
                      <PrismicRichText field={item.before_content} />
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        );

      case "with-arrow":
        return (
          <div className="space-y-6">
            {before_section.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-6">
                <Card className="flex-1 overflow-hidden">
                  {item.before_image?.url && (
                    <div className="aspect-video w-full overflow-hidden">
                      <Image
                        src={item.before_image.url}
                        alt={item.before_image.alt || "Content image"}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    {item.before_section && (
                      <h4 className="font-semibold text-[#1e293b] mb-2">
                        {item.before_section}
                      </h4>
                    )}
                    <div className="prose prose-sm text-[#64748b]">
                      <PrismicRichText field={item.before_content} />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex-shrink-0">
                  <ArrowRight className="w-6 h-6 text-blue-600" />
                </div>

                <div className="flex-1 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-sm text-gray-500 text-center">
                    After content will appear here when configured
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      default: // side-by-side
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Content Section */}
            <div className="space-y-6">
              <div className="text-center">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 border border-blue-200">
                  Content
                </span>
              </div>
              {before_section.map((item: any, index: number) => (
                <Card key={index} className="overflow-hidden">
                  {item.before_image?.url && (
                    <div className="aspect-video w-full overflow-hidden">
                      <Image
                        src={item.before_image.url}
                        alt={item.before_image.alt || "Content image"}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    {item.before_section && (
                      <h3 className="text-lg font-semibold text-[#1e293b] mb-3">
                        {item.before_section}
                      </h3>
                    )}
                    <div className="prose prose-sm text-[#64748b]">
                      <PrismicRichText field={item.before_content} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Placeholder for After Section */}
            <div className="space-y-6">
              <div className="text-center">
                <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-sm font-medium text-gray-500 border border-gray-200">
                  After (Coming Soon)
                </span>
              </div>
              <Card className="h-full">
                <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ArrowRight className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">
                      After content will appear here when the schema is
                      configured
                    </p>
                  </div>
                </CardContent>
              </Card>
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
      <div className="container mx-auto px-4 max-w-6xl">
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1e293b] mb-4">{title}</h2>
          </div>
        )}
        {renderContent()}
      </div>
    </section>
  );
};

export default BeforeAfterBlock;
