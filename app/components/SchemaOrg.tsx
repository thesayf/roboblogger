"use client";
import { usePathname } from "next/navigation";

type SchemaProps = {
  schema: any;
};

export default function SchemaOrg({ schema }: SchemaProps) {
  const pathname = usePathname();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
