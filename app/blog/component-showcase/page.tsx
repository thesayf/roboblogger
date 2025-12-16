"use client";

import React from "react";
import Link from "next/link";
import RichTextComponent from "@/components/blog/RichTextComponent";
import ImageComponent from "@/components/blog/ImageComponent";
import CalloutComponent from "@/components/blog/CalloutComponent";
import QuoteComponent from "@/components/blog/QuoteComponent";
import CTAComponent from "@/components/blog/CTAComponent";
import VideoComponent from "@/components/blog/VideoComponent";
import TableComponent from "@/components/blog/TableComponent";
import BarChartComponent from "@/components/blog/BarChartComponent";
import LineChartComponent from "@/components/blog/LineChartComponent";
import PieChartComponent from "@/components/blog/PieChartComponent";
import ComparisonTableComponent from "@/components/blog/ComparisonTableComponent";
import ProsConsComponent from "@/components/blog/ProsConsComponent";
import TimelineComponent from "@/components/blog/TimelineComponent";
import FlowchartComponent from "@/components/blog/FlowchartComponent";
import StepByStepComponent from "@/components/blog/StepByStepComponent";
import CodeBlockComponent from "@/components/blog/CodeBlockComponent";

export default function ComponentShowcase() {
  // Mock component data
  const mockComponents = {
    richText: {
      _id: "1",
      type: "rich_text" as const,
      order: 1,
      content: "This is a **rich text** component with *markdown* support. You can include [links](https://example.com), lists, and more.\n\n- Item one\n- Item two\n- Item three\n\nThis demonstrates how regular paragraph text will look in articles.",
    } as any,
    calloutInfo: {
      _id: "2",
      type: "callout" as const,
      order: 2,
      variant: "info" as const,
      title: "Information Callout",
      content: "This is an info callout box. Use it to highlight important information without breaking the flow of the article.",
    } as any,
    calloutWarning: {
      _id: "3",
      type: "callout" as const,
      order: 3,
      variant: "warning" as const,
      title: "Warning Callout",
      content: "This is a warning callout. Use it to alert readers about potential issues or things to watch out for.",
    } as any,
    calloutSuccess: {
      _id: "4",
      type: "callout" as const,
      order: 4,
      variant: "success" as const,
      title: "Success Callout",
      content: "This is a success callout. Use it to highlight positive outcomes or key takeaways.",
    } as any,
    quote: {
      _id: "5",
      type: "quote" as const,
      order: 5,
      content: "The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks, and then starting on the first one.",
      author: "Mark Twain",
    } as any,
    stepByStep: {
      _id: "6",
      type: "step_by_step" as const,
      order: 6,
      data: {
        title: "How to Conduct Your Energy Audit",
        description: "Follow these steps to map your personal energy patterns",
        steps: [
          {
            title: "Create Your Tracking System",
            description: "Set up a simple system to record your energy levels throughout the day.",
            substeps: [
              "Choose between digital or paper tracking",
              "Create columns for time, energy level (1-10), and notes",
              "Prepare to track for at least two weeks",
            ],
          } as any,
          {
            title: "Track Energy Levels",
            description: "Rate your energy on a scale of 1-10 every 90 minutes during waking hours.",
            substeps: [
              "Rate energy (1=exhausted, 10=peak performance)",
              "Note activities, food, caffeine intake",
              "Record focus level and mood",
            ],
          } as any,
          {
            title: "Identify Patterns",
            description: "Review your data to find consistent energy patterns.",
            substeps: [
              "Note consistent high-energy windows",
              "Identify predictable energy dips",
              "Look for correlations with sleep, food, etc.",
            ],
          } as any,
        ],
      } as any,
    } as any,
    table: {
      _id: "7",
      type: "table" as const,
      order: 7,
      headers: ["Energy Level", "Best Tasks", "Avoid"],
      rows: [
        ["8-10 (Peak)", "Deep work, creative thinking, complex problem-solving", "Meetings, email, administrative tasks"],
        ["5-7 (Moderate)", "Collaborative work, meetings, planning", "Highly creative work, complex analysis"],
        ["3-4 (Low)", "Email, administrative tasks, organizing", "Important decisions, creative work"],
        ["1-2 (Very Low)", "Breaks, walking, meditation, simple chores", "Any important work, meetings, or learning"],
      ],
      tableCaption: "Energy Level Task Alignment Framework",
    } as any,
    comparisonTable: {
      _id: "8",
      type: "comparison_table" as const,
      order: 8,
      data: {
        title: "Time Management vs Energy Management",
        columns: ["Feature", "Time Management", "Energy Management"],
        rows: [
          ["Approach", "Assumes all hours are equal", "Recognizes energy fluctuates"],
          ["Focus", "Fitting more into your day", "Aligning work with energy"],
          ["Outcome", "Can lead to burnout", "Promotes sustainability"],
          ["Methodology", "Ignores natural patterns", "Works with biological rhythms"],
        ],
      } as any,
    } as any,
    prosCons: {
      _id: "9",
      type: "pros_cons" as const,
      order: 9,
      data: {
        title: "Morning vs Evening Deep Work",
        pros: [
          "Fresh mental energy after sleep",
          "Fewer interruptions early in the day",
          "Builds momentum for the rest of the day",
          "Aligns with natural cortisol peaks",
        ],
        cons: [
          "Requires early wake-up time",
          "May conflict with family routines",
          "Not ideal for night owls",
          "Requires consistent sleep schedule",
        ],
      } as any,
    } as any,
    timeline: {
      _id: "10",
      type: "timeline" as const,
      order: 10,
      data: {
        title: "Typical Energy Pattern Throughout the Day",
        events: [
          { date: "6:00 AM", title: "Wake Up", description: "Cortisol levels begin rising" } as any,
          { date: "8:00 AM", title: "Peak Morning Energy", description: "Optimal for deep work and complex thinking" } as any,
          { date: "12:00 PM", title: "Post-Lunch Dip", description: "Energy naturally decreases after eating" } as any,
          { date: "3:00 PM", title: "Afternoon Recovery", description: "Energy begins to rise again" } as any,
          { date: "6:00 PM", title: "Evening Wind Down", description: "Energy starts declining toward sleep" } as any,
        ],
      } as any,
    } as any,
    codeBlock: {
      _id: "11",
      type: "code_block" as const,
      order: 11,
      language: "javascript",
      code: `// Example: Energy tracking function
function trackEnergy(time, level, activities) {
  return {
    timestamp: time,
    energyLevel: level,
    activities: activities,
    notes: "Record what you were doing"
  };
}

const morningEntry = trackEnergy("9:00 AM", 8, ["deep work", "writing"]);`,
      caption: "Simple energy tracking implementation",
    } as any,
    image: {
      _id: "12",
      type: "image" as const,
      order: 12,
      url: "https://media.istockphoto.com/id/183311199/vector/feather-set.jpg?s=612x612&w=0&k=20&c=Uv0rtL49ykYKsdhSOudk4k9nWXOC1E3AYjwilI9cpRo=",
      alt: "Minimal feather illustration",
      caption: "Example image component with caption",
    } as any,
    cta: {
      _id: "13",
      type: "cta" as const,
      order: 13,
      title: "Ready to optimize your energy?",
      content: "Start tracking your energy patterns today with RoboBlogger's built-in time-blocking features.",
      text: "Try RoboBlogger Free",
      link: "/homepage-minimal",
    } as any,
    barChart: {
      _id: "14",
      type: "bar_chart" as const,
      order: 14,
      data: {
        title: "Average Energy Levels by Time of Day",
        xAxisLabel: "Time of Day",
        yAxisLabel: "Energy Level (1-10)",
        data: [
          { label: "6 AM", value: 4 } as any,
          { label: "9 AM", value: 8 } as any,
          { label: "12 PM", value: 6 } as any,
          { label: "3 PM", value: 5 } as any,
          { label: "6 PM", value: 7 } as any,
          { label: "9 PM", value: 4 } as any,
        ],
      } as any,
    } as any,
    lineChart: {
      _id: "15",
      type: "line_chart" as const,
      order: 15,
      data: {
        title: "Energy Pattern Over Two Weeks",
        xAxisLabel: "Days",
        yAxisLabel: "Average Energy",
        data: [
          { label: "Day 1", value: 6 } as any,
          { label: "Day 3", value: 7 } as any,
          { label: "Day 5", value: 8 } as any,
          { label: "Day 7", value: 7 } as any,
          { label: "Day 9", value: 8 } as any,
          { label: "Day 11", value: 9 } as any,
          { label: "Day 14", value: 8 } as any,
        ],
      } as any,
    } as any,
    pieChart: {
      _id: "16",
      type: "pie_chart" as const,
      order: 16,
      data: {
        title: "How You Spend Your Peak Energy Hours",
        data: [
          { label: "Deep Work", value: 40 } as any,
          { label: "Meetings", value: 25 } as any,
          { label: "Email", value: 20 } as any,
          { label: "Administrative", value: 15 } as any,
        ],
      } as any,
    } as any,
    video: {
      _id: "17",
      type: "video" as const,
      order: 17,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      videoTitle: "Example Video Component",
    } as any,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
            RoboBlogger
          </Link>
          <div className="flex gap-6">
            <Link href="/about" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/pricing" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/blog-redesign" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              Blog
            </Link>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 py-20">
        {/* Article Header */}
        <header className="mb-16">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 font-mono">
            <time>Oct 15, 2025</time>
            <span>·</span>
            <span>15 min read</span>
            <span>·</span>
            <span>Component Showcase</span>
          </div>

          <h1 className="text-5xl text-gray-900 mb-8 leading-tight" style={{ fontFamily: 'Lora, Georgia, serif' }}>
            Blog Component Showcase
          </h1>

          <p className="text-xl text-gray-700 leading-relaxed" style={{ fontFamily: 'Lora, Georgia, serif' }}>
            This page demonstrates all available blog components and their styling. Use this as a reference for how different content types will appear in published articles.
          </p>
        </header>

        {/* Components Showcase */}
        <div className="prose prose-xl max-w-none text-xl leading-relaxed" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          <h2>Rich Text Component</h2>
          <RichTextComponent component={mockComponents.richText} />

          <h2>Callout Components</h2>
          <CalloutComponent component={mockComponents.calloutInfo} />
          <CalloutComponent component={mockComponents.calloutWarning} />
          <CalloutComponent component={mockComponents.calloutSuccess} />

          <h2>Quote Component</h2>
          <QuoteComponent component={mockComponents.quote} />

          <h2>Step-by-Step Component</h2>
          <StepByStepComponent component={mockComponents.stepByStep} />

          <h2>Table Component</h2>
          <TableComponent component={mockComponents.table} />

          <h2>Comparison Table</h2>
          <ComparisonTableComponent component={mockComponents.comparisonTable} />

          <h2>Pros & Cons</h2>
          <ProsConsComponent component={mockComponents.prosCons} />

          <h2>Timeline Component</h2>
          <TimelineComponent component={mockComponents.timeline} />

          <h2>Code Block</h2>
          <CodeBlockComponent component={mockComponents.codeBlock} />

          <h2>Image Component</h2>
          <ImageComponent component={mockComponents.image} />

          <h2>Call-to-Action</h2>
          <CTAComponent component={mockComponents.cta} />

          <h2>Bar Chart</h2>
          <BarChartComponent component={mockComponents.barChart} />

          <h2>Line Chart</h2>
          <LineChartComponent component={mockComponents.lineChart} />

          <h2>Pie Chart</h2>
          <PieChartComponent component={mockComponents.pieChart} />

          <h2>Video Component</h2>
          <VideoComponent component={mockComponents.video} />
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-500 font-mono">
          © 2025 RoboBlogger. Fast, keyboard-first productivity.
        </div>
      </footer>
    </div>
  );
}
