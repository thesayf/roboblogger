import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock, AlertTriangle } from "lucide-react";

/**
 * Props for `ProgressTrackerBlock`.
 */
export type ProgressTrackerBlockProps =
  SliceComponentProps<any>;

/**
 * Component for "ProgressTrackerBlock" Slices.
 */
const ProgressTrackerBlock: FC<ProgressTrackerBlockProps> = ({ slice }) => {
  const { title, description, checklist_items } = slice.primary;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return <CheckCircle className="w-4 h-4" />;
      case "medium":
        return <Clock className="w-4 h-4" />;
      case "hard":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  // Sort items by order
  const sortedItems = [...checklist_items].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-12 bg-white"
    >
      <div className="container mx-auto px-4 max-w-4xl">
        {title && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#1e293b] mb-4">{title}</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>
        )}

        {description && (
          <div className="prose prose-lg max-w-none mx-auto text-center text-[#64748b] mb-12">
            <PrismicRichText field={description} />
          </div>
        )}

        <div className="space-y-4">
          {sortedItems.map((item, index) => (
            <Card
              key={index}
              className="border border-gray-200 hover:shadow-md transition-shadow duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {item.order || index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-[#1e293b] flex-1">
                        {item.item_text}
                      </h3>

                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        {item.estimated_time && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.estimated_time}
                          </Badge>
                        )}

                        {item.difficulty && (
                          <Badge
                            className={`text-xs flex items-center gap-1 ${getDifficultyColor(item.difficulty)}`}
                          >
                            {getDifficultyIcon(item.difficulty)}
                            {item.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {checklist_items.length === 0 && (
          <Card className="p-8 text-center border-2 border-dashed border-gray-300">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No checklist items available. Add some items in the CMS.
            </p>
          </Card>
        )}
      </div>
    </section>
  );
};

export default ProgressTrackerBlock;
