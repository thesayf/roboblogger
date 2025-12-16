import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";
import Block from "@/models/Block";
import Task from "@/models/Task"; // Add this line
import Project from "@/models/Project"; // Add this if you have a Project model
import Routine from "@/models/Routine"; // Add this if you have a Routine model

// Ensure all models are registered
const models = { Day, Block, Task, Project, Routine }; // Add all your models here

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const today = new Date().toISOString().split("T")[0];

    let day = await Day.findOne({ date: today }).populate({
      path: "blocks",
      model: Block,
      populate: { 
        path: "tasks",
        model: Task
      },
    });

    if (!day) {
      day = await Day.create({ date: today });
    }

    return NextResponse.json(day);
  } catch (error) {
    console.error("Error fetching or creating day:", error);
    return NextResponse.json(
      { error: "Error fetching or creating day" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const updatedDay = await Day.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedDay) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    return NextResponse.json(updatedDay);
  } catch (error) {
    console.error("Error updating day:", error);
    return NextResponse.json({ error: "Error updating day" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const { date, blocks } = body;

    let day = await Day.findOne({ date });

    if (day) {
      return NextResponse.json(
        { error: "Day already exists" },
        { status: 409 }
      );
    }

    day = new Day({ date });
    await day.save();

    if (blocks && blocks.length > 0) {
      for (const blockData of blocks) {
        const block = new Block({
          ...blockData,
          dayId: day._id,
        });
        await block.save();
        day.blocks.push(block._id);
      }
      await day.save();
    }

    const populatedDay = await Day.findById(day._id).populate("blocks");
    return NextResponse.json(populatedDay, { status: 201 });
  } catch (error) {
    console.error("Error creating day:", error);
    return NextResponse.json({ error: "Error creating day" }, { status: 500 });
  }
}
