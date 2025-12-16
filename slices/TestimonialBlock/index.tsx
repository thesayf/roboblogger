import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";
import Image from "next/image";

/**
 * Props for `TestimonialBlock`.
 */
export type TestimonialBlockProps =
  SliceComponentProps<any>;

/**
 * Component for "TestimonialBlock" Slices.
 */
const TestimonialBlock: FC<TestimonialBlockProps> = ({ slice }) => {
  const { title, layout, testimonials } = slice.primary;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
      />
    ));
  };

  const renderCarousel = () => (
    <div className="overflow-hidden">
      <div className="flex gap-6 snap-x snap-mandatory overflow-x-auto pb-4">
        {testimonials.map((testimonial: any, index: number) => (
          <Card
            key={index}
            className="flex-shrink-0 w-80 snap-start border border-gray-200 hover:shadow-lg transition-shadow duration-300"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  {renderStars(testimonial.rating || 5)}
                </div>
                <Quote className="w-8 h-8 text-blue-200" />
              </div>

              <div className="prose prose-sm max-w-none text-[#64748b] mb-6">
                <PrismicRichText field={testimonial.quote} />
              </div>

              <div className="flex items-center gap-4">
                {testimonial.photo?.url && (
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={testimonial.photo.url}
                      alt={testimonial.photo.alt || `${testimonial.name} photo`}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-[#1e293b]">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-[#64748b]">
                    {testimonial.title}
                  </div>
                  {testimonial.company && (
                    <div className="text-sm text-blue-600">
                      {testimonial.company}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial: any, index: number) => (
        <Card
          key={index}
          className="border border-gray-200 hover:shadow-lg transition-shadow duration-300 h-fit"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                {renderStars(testimonial.rating || 5)}
              </div>
              <Quote className="w-6 h-6 text-blue-200" />
            </div>

            <div className="prose prose-sm max-w-none text-[#64748b] mb-6">
              <PrismicRichText field={testimonial.quote} />
            </div>

            <div className="flex items-center gap-3">
              {testimonial.photo?.url && (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={testimonial.photo.url}
                    alt={testimonial.photo.alt || `${testimonial.name} photo`}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold text-[#1e293b] text-sm">
                  {testimonial.name}
                </div>
                <div className="text-xs text-[#64748b]">
                  {testimonial.title}
                </div>
                {testimonial.company && (
                  <div className="text-xs text-blue-600">
                    {testimonial.company}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderFeatured = () => {
    const featured = testimonials.find((t: any) => t.featured) || testimonials[0];
    const others = testimonials.filter((t: any) => t !== featured);

    return (
      <div className="space-y-8">
        {/* Featured Testimonial */}
        {featured && (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {renderStars(featured.rating || 5)}
                  </div>
                  <Badge className="bg-blue-600 text-white">Featured</Badge>
                </div>
                <Quote className="w-12 h-12 text-blue-200" />
              </div>

              <div className="prose prose-lg max-w-none text-[#1e293b] mb-8">
                <PrismicRichText field={featured.quote} />
              </div>

              <div className="flex items-center gap-6">
                {featured.photo?.url && (
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={featured.photo.url}
                      alt={featured.photo.alt || `${featured.name} photo`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-xl text-[#1e293b]">
                    {featured.name}
                  </div>
                  <div className="text-lg text-[#64748b]">{featured.title}</div>
                  {featured.company && (
                    <div className="text-lg text-blue-600 font-medium">
                      {featured.company}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other Testimonials */}
        {others.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {others.map((testimonial: any, index: number) => (
              <Card
                key={index}
                className="border border-gray-200 hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {renderStars(testimonial.rating || 5)}
                    </div>
                    <Quote className="w-6 h-6 text-blue-200" />
                  </div>

                  <div className="prose prose-sm max-w-none text-[#64748b] mb-6">
                    <PrismicRichText field={testimonial.quote} />
                  </div>

                  <div className="flex items-center gap-3">
                    {testimonial.photo?.url && (
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={testimonial.photo.url}
                          alt={
                            testimonial.photo.alt || `${testimonial.name} photo`
                          }
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-[#1e293b] text-sm">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-[#64748b]">
                        {testimonial.title}
                      </div>
                      {testimonial.company && (
                        <div className="text-xs text-blue-600">
                          {testimonial.company}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (layout) {
      case "carousel":
        return renderCarousel();
      case "featured":
        return renderFeatured();
      default:
        return renderGrid();
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
            <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>
        )}
        {renderContent()}
      </div>
    </section>
  );
};

export default TestimonialBlock;
