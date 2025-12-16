import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, ExternalLink } from "lucide-react";
import Link from "next/link";

/**
 * Props for `CtaBlock`.
 */
export type CtaBlockProps = SliceComponentProps<Content.CtaBlockSlice>;

/**
 * Component for "CtaBlock" Slices.
 */
const CtaBlock: FC<CtaBlockProps> = ({ slice }) => {
  const {
    headline,
    description,
    button_text,
    button_link,
    variant,
    background_style,
    show_icon,
    icon_type,
  } = slice.primary;

  const getIcon = () => {
    if (!show_icon) return null;

    switch (icon_type) {
      case "download":
        return <Download className="w-4 h-4" />;
      case "external":
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <ArrowRight className="w-4 h-4" />;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case "secondary":
        return "secondary";
      case "outline":
        return "outline";
      case "subtle":
        return "ghost";
      case "urgent":
        return "destructive";
      default:
        return "default";
    }
  };

  const getBackgroundClasses = () => {
    switch (background_style) {
      case "bordered":
        return "border-2 border-dashed border-blue-300 bg-white";
      case "minimal":
        return "bg-transparent";
      case "gradient":
        return "bg-gradient-to-br from-blue-600 to-indigo-600 text-white";
      default: // colored
        return "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200";
    }
  };

  const getTextClasses = () => {
    return background_style === "gradient" ? "text-white" : "text-[#1e293b]";
  };

  const getDescriptionClasses = () => {
    return background_style === "gradient" ? "text-blue-100" : "text-[#64748b]";
  };

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-12"
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <div
          className={`
          text-center p-8 md:p-12 rounded-2xl 
          ${getBackgroundClasses()}
          ${variant === "urgent" ? "animate-pulse" : ""}
        `}
        >
          {headline && (
            <h2
              className={`text-3xl md:text-4xl font-bold mb-6 ${getTextClasses()}`}
            >
              {headline}
            </h2>
          )}

          {description && (
            <div
              className={`prose prose-lg max-w-none mx-auto mb-8 ${getDescriptionClasses()}`}
            >
              <PrismicRichText field={description} />
            </div>
          )}

          {button_text && button_link && (
            <div className="flex justify-center">
              <Button
                asChild
                variant={getButtonVariant()}
                size="lg"
                className={`
                  ${background_style === "gradient" ? "bg-white text-blue-600 hover:bg-gray-100" : ""}
                  ${variant === "urgent" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                  text-lg px-8 py-3 h-auto
                `}
              >
                <Link
                  href={(button_link as any)?.url || "#"}
                  target={(button_link as any)?.target || undefined}
                  rel={
                    (button_link as any)?.target === "_blank"
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="flex items-center gap-2"
                >
                  {button_text}
                  {getIcon()}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CtaBlock;
