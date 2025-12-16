import mongoose from "mongoose";
import Block from "@/models/Block"; // Import your models
import Day from "@/models/Day";
import Task from "@/models/Task";
import User from "@/models/User";
import Event from "@/models/Event";
import BlogPost from "@/models/BlogPost";
import BlogComponent from "@/models/BlogComponent";
import Topic from "@/models/Topic";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: Cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Connection pool size
      minPoolSize: 2,
      maxIdleTimeMS: 10000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      console.log('MongoDB connected');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
