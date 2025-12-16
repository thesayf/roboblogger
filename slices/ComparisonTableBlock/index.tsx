import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Minus } from "lucide-react";

/**
 * Props for `ComparisonTableBlock`.
 */
export type ComparisonTableBlockProps =
  SliceComponentProps<any>;

/**
 * Component for "ComparisonTableBlock" Slices.
 */
const ComparisonTableBlock: FC<ComparisonTableBlockProps> = ({ slice }) => {
  const { title, description, comparison_items } = slice.primary;

  const getWinnerBadge = (winner: string) => {
    switch (winner) {
      case "option_a":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Crown className="w-3 h-3 mr-1" />
            Winner
          </Badge>
        );
      case "option_b":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Crown className="w-3 h-3 mr-1" />
            Winner
          </Badge>
        );
      case "tie":
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            <Minus className="w-3 h-3 mr-1" />
            Tie
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!comparison_items || comparison_items.length === 0) {
    return (
      <section
        data-slice-type={slice.slice_type}
        data-slice-variation={slice.variation}
        className="py-12 bg-white"
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <Card className="p-8 text-center border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No comparison data available.</p>
          </Card>
        </div>
      </section>
    );
  }

  // Get the titles from the first item (they should be consistent across all items)
  const optionATitle = comparison_items[0]?.option_a_title || "Option A";
  const optionBTitle = comparison_items[0]?.option_b_title || "Option B";

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-12 bg-white"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        {(title || description) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl font-bold text-[#1e293b] mb-4">
                {title}
              </h2>
            )}
            {description && (
              <div className="prose prose-lg max-w-2xl mx-auto text-[#64748b]">
                <PrismicRichText field={description} />
              </div>
            )}
          </div>
        )}

        {/* Comparison Table */}
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-[#f8fafc]">
                  <th className="text-left py-4 px-6 font-semibold text-[#1e293b]">
                    Feature
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-[#1e293b]">
                    {optionATitle}
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-[#1e293b]">
                    {optionBTitle}
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-[#1e293b]">
                    Winner
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison_items.map((item: any, index: number) => (
                  <tr
                    key={index}
                    className="border-b last:border-b-0 hover:bg-[#f8fafc] transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-[#1e293b]">
                      {item.feature}
                    </td>
                    <td
                      className={`py-4 px-6 text-center ${
                        item.winner === "option_a"
                          ? "bg-green-50 font-semibold text-green-800"
                          : "text-[#64748b]"
                      }`}
                    >
                      {item.option_a_value}
                    </td>
                    <td
                      className={`py-4 px-6 text-center ${
                        item.winner === "option_b"
                          ? "bg-blue-50 font-semibold text-blue-800"
                          : "text-[#64748b]"
                      }`}
                    >
                      {item.option_b_value}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getWinnerBadge(item.winner || "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default ComparisonTableBlock;
