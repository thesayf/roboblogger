const mongoose = require('mongoose');

// MongoDB connection string - update if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eb-todo';

// Connect to MongoDB
mongoose.connect(MONGODB_URI).then(() => {
  console.log('Connected to MongoDB');
  createProject();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define schemas
const ProjectSchema = new mongoose.Schema({
  userId: String,
  name: String,
  goalId: String,
  dueDate: Date,
  completed: Boolean,
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  order: Number
});

const TaskSchema = new mongoose.Schema({
  userId: String,
  title: String,
  duration: Number,
  completed: Boolean,
  projectId: mongoose.Schema.Types.ObjectId,
  order: Number
});

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

async function createProject() {
  const userId = 'user_2qaE5Awk8ffVfmgav6R6wtoqEpA';
  
  // You'll need to get the actual goal ID - I'll use a placeholder
  // You can find the Career Growth goal ID in your database
  const careerGoalId = 'REPLACE_WITH_CAREER_GOAL_ID'; // <-- Update this!
  
  try {
    // Create the project
    const project = new Project({
      userId: userId,
      name: "Launch Personal Portfolio",
      goalId: careerGoalId,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      completed: false,
      tasks: [],
      order: 0
    });
    
    await project.save();
    console.log('Created project:', project.name, 'with ID:', project._id);
    
    // Create tasks for the project
    const taskData = [
      { title: "Design homepage layout", duration: 120 },
      { title: "Build project showcase section", duration: 180 },
      { title: "Implement contact form", duration: 90 },
      { title: "Deploy to hosting", duration: 60 }
    ];
    
    for (let i = 0; i < taskData.length; i++) {
      const task = new Task({
        userId: userId,
        title: taskData[i].title,
        duration: taskData[i].duration,
        completed: false,
        projectId: project._id,
        order: i
      });
      
      await task.save();
      project.tasks.push(task._id);
      console.log(`  - Added task: ${task.title} (${task.duration} min)`);
    }
    
    await project.save();
    console.log('✅ Project created successfully with', project.tasks.length, 'tasks');
    
  } catch (error) {
    console.error('Error creating project:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}