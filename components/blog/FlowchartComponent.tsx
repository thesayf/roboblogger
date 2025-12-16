"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";

interface FlowchartComponentProps {
  component: IBlogComponent;
}

export default function FlowchartComponent({ component }: FlowchartComponentProps) {
  // Flowcharts don't fit minimal brand - hide them
  return null;
}
