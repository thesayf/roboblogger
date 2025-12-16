// import { NextRequest, NextResponse } from "next/server";

// export async function POST(request: NextRequest) {
//   try {
//     const { email, name } = await request.json();

//     // Validate email
//     if (!email || !email.includes("@")) {
//       return NextResponse.json(
//         { error: "Valid email is required" },
//         { status: 400 }
//       );
//     }

//     // Call Beehiiv API
//     const response = await fetch(
//       `https://api.beehiiv.com/v2/publications/${process.env.BEEHIIV_PUBLICATION_ID}/subscriptions`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.BEEHIIV_API_KEY}`,
//         },
//         body: JSON.stringify({
//           email: email,
//           reactivate_existing: false,
//           send_welcome_email: true,
//           utm_source: "website",
//           utm_medium: "blog",
//           // Add custom fields if needed
//           custom_fields: {
//             name: name || "",
//             source: "blog_sidebar",
//           },
//         }),
//       }
//     );

//     if (response.ok) {
//       const data = await response.json();
//       return NextResponse.json({
//         success: true,
//         message: "🎉 Welcome! You're now subscribed to our newsletter.",
//         data: data,
//       });
//     } else {
//       const errorData = await response.json();

//       // Handle specific Beehiiv error cases
//       if (response.status === 400 && errorData.errors?.email) {
//         return NextResponse.json(
//           { error: "This email is already subscribed or invalid" },
//           { status: 400 }
//         );
//       }

//       return NextResponse.json(
//         { error: errorData.message || "Subscription failed" },
//         { status: response.status }
//       );
//     }
//   } catch (error: any) {
//     console.error("Beehiiv API error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// // Optional: Handle GET requests to check API status
// export async function GET() {
//   return NextResponse.json({
//     status: "Beehiiv Newsletter API is running",
//     timestamp: new Date().toISOString(),
//   });
// }

import { NextRequest, NextResponse } from "next/server";
import { BeehiivClient } from "@beehiiv/sdk";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const client = new BeehiivClient({
      token: process.env.BEEHIIV_API_KEY!,
    });

    const subscription = await client.subscriptions.create(
      process.env.BEEHIIV_PUBLICATION_ID!,
      {
        email: email,
        reactivateExisting: false,
        sendWelcomeEmail: true,
        utmSource: "website",
        utmMedium: "blog",
        utmCampaign: "sidebar_signup",
        customFields: name
          ? [
              {
                name: "name",
                value: name,
              },
            ]
          : [],
      }
    );

    return NextResponse.json({
      success: true,
      message: "🎉 Welcome! You're now subscribed to our newsletter.",
      data: subscription,
    });
  } catch (error: any) {
    console.error("Beehiiv SDK error:", error);

    // Handle BeehiivError specifically
    if (error.statusCode === 400) {
      return NextResponse.json(
        { error: "Email already subscribed or invalid" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}

// Optional: Handle GET requests to check API status
export async function GET() {
  return NextResponse.json({
    status: "Beehiiv Newsletter API is running",
    timestamp: new Date().toISOString(),
  });
}
