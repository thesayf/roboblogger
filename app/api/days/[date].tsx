import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { date } = req.query;

  await dbConnect();

  if (req.method === "GET") {
    try {
      const day = await Day.findOne({ date });
      if (!day) {
        return res.status(404).json({ message: "Day not found" });
      }
      res.status(200).json(day);
    } catch (error) {
      res.status(500).json({ message: "Error fetching day" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
