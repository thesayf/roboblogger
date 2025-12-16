"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";
import RichTextComponent from "./RichTextComponent";
import ImageComponent from "./ImageComponent";
import CalloutComponent from "./CalloutComponent";
import QuoteComponent from "./QuoteComponent";
import CTAComponent from "./CTAComponent";
import VideoComponent from "./VideoComponent";
import TableComponent from "./TableComponent";
import BarChartComponent from "./BarChartComponent";
import LineChartComponent from "./LineChartComponent";
import PieChartComponent from "./PieChartComponent";
import ComparisonTableComponent from "./ComparisonTableComponent";
import ProsConsComponent from "./ProsConsComponent";
import TimelineComponent from "./TimelineComponent";
import FlowchartComponent from "./FlowchartComponent";
import StepByStepComponent from "./StepByStepComponent";
import CodeBlockComponent from "./CodeBlockComponent";

interface BlogComponentRendererProps {
  components: IBlogComponent[];
}

export default function BlogComponentRenderer({ components }: BlogComponentRendererProps) {
  const sortedComponents = components.sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      {sortedComponents.map((component) => {
        switch (component.type) {
          case "rich_text":
            return <RichTextComponent key={component._id as string} component={component} />;
          case "image":
            return <ImageComponent key={component._id as string} component={component} />;
          case "callout":
            return <CalloutComponent key={component._id as string} component={component} />;
          case "quote":
            return <QuoteComponent key={component._id as string} component={component} />;
          case "cta":
            return <CTAComponent key={component._id as string} component={component} />;
          case "video":
            return <VideoComponent key={component._id as string} component={component} />;
          case "table":
            return <TableComponent key={component._id as string} component={component} />;
          case "bar_chart":
            return <BarChartComponent key={component._id as string} component={component} />;
          case "line_chart":
            return <LineChartComponent key={component._id as string} component={component} />;
          case "pie_chart":
            return <PieChartComponent key={component._id as string} component={component} />;
          case "comparison_table":
            return <ComparisonTableComponent key={component._id as string} component={component} />;
          case "pros_cons":
            return <ProsConsComponent key={component._id as string} component={component} />;
          case "timeline":
            return <TimelineComponent key={component._id as string} component={component} />;
          case "flowchart":
            return <FlowchartComponent key={component._id as string} component={component} />;
          case "step_by_step":
            return <StepByStepComponent key={component._id as string} component={component} />;
          case "code_block":
            return <CodeBlockComponent key={component._id as string} component={component} />;
          default:
            return null;
        }
      })}
    </div>
  );
}