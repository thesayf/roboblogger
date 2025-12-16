import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

/**
 * Props for `CalloutBlock`.
 */
export type CalloutBlockProps = SliceComponentProps<Content.CalloutBlockSlice>;

/**
 * Component for "CalloutBlock" Slices.
 */
const CalloutBlock: FC<CalloutBlockProps> = ({ slice }) => {
  const { variant, title, content } = slice.primary;

  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return {
          containerClass: "border-amber-200 bg-amber-50",
          iconClass: "text-amber-600",
          titleClass: "text-amber-900",
          contentClass: "text-amber-800",
          icon: AlertTriangle,
        };
      case "error":
        return {
          containerClass: "border-red-200 bg-red-50",
          iconClass: "text-red-600",
          titleClass: "text-red-900",
          contentClass: "text-red-800",
          icon: XCircle,
        };
      case "success":
        return {
          containerClass: "border-green-200 bg-green-50",
          iconClass: "text-green-600",
          titleClass: "text-green-900",
          contentClass: "text-green-800",
          icon: CheckCircle,
        };
      default: // info
        return {
          containerClass: "border-blue-200 bg-blue-50",
          iconClass: "text-blue-600",
          titleClass: "text-blue-900",
          contentClass: "text-blue-800",
          icon: Info,
        };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = styles.icon;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-8 bg-white"
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className={`border-l-4 ${styles.containerClass}`}>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <IconComponent className={`w-6 h-6 ${styles.iconClass}`} />
              </div>
              <div className="flex-1">
                {title && (
                  <h3
                    className={`text-lg font-semibold mb-3 ${styles.titleClass}`}
                  >
                    {title}
                  </h3>
                )}
                {content && (
                  <div
                    className={`prose prose-sm max-w-none ${styles.contentClass}`}
                  >
                    <PrismicRichText field={content} />
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

export default CalloutBlock;
