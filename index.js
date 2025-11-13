import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.bcz1ya4.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

// Connect to MongoDB
connectDB();

// Database and Collections
let noticeCollection;
let classroomBookingCollection;
let labBookingCollection;
let userDashboardCollection;
let galleryCollection;

client.connect().then(() => {
    const database = client.db("CSEJNU_PortalDB");
    noticeCollection = database.collection("notice");
    classroomBookingCollection = database.collection("classroom-bookings");
    labBookingCollection = database.collection("lab-bookings");
    userDashboardCollection = database.collection("user-dashboard");
    galleryCollection = database.collection("gallery");
    console.log("📚 Database collections initialized");
});

// Middleware 
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CSE JNU Portal Backend API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', database: 'MongoDB Connected' });
});

// ========== NOTICE ROUTES ==========

// Get all notices
app.get('/api/notices', async (req, res) => {
  try {
    const notices = await noticeCollection.find().sort({ date: -1 }).toArray();
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notices', error: error.message });
  }
});

// Get latest 3 notices
app.get('/api/notices/latest', async (req, res) => {
  try {
    const notices = await noticeCollection.find().sort({ date: -1 }).limit(3).toArray();
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching latest notices', error: error.message });
  }
});

// Get single notice by ID
app.get('/api/notices/:id', async (req, res) => {
  try {
    const notice = await noticeCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (notice) {
      res.json(notice);
    } else {
      res.status(404).json({ message: 'Notice not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notice', error: error.message });
  }
});

// Create new notice
app.post('/api/notices', async (req, res) => {
  try {
    const newNotice = {
      ...req.body,
      date: new Date().toISOString()
    };
    const result = await noticeCollection.insertOne(newNotice);
    res.status(201).json({ message: 'Notice created successfully', noticeId: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating notice', error: error.message });
  }
});

// Update notice
app.put('/api/notices/:id', async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;
    const result = await noticeCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    if (result.matchedCount > 0) {
      res.json({ message: 'Notice updated successfully' });
    } else {
      res.status(404).json({ message: 'Notice not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating notice', error: error.message });
  }
});

// Delete notice
app.delete('/api/notices/:id', async (req, res) => {
  try {
    const result = await noticeCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount > 0) {
      res.json({ message: 'Notice deleted successfully' });
    } else {
      res.status(404).json({ message: 'Notice not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notice', error: error.message });
  }
});

// ========== CLASSROOM BOOKING ROUTES ==========

// Get all classroom bookings
app.get('/api/classroom-bookings', async (req, res) => {
  try {
    const bookings = await classroomBookingCollection.find().sort({ createdAt: -1 }).toArray();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classroom bookings', error: error.message });
  }
});

// Get bookings by user email
app.get('/api/classroom-bookings/user/:email', async (req, res) => {
  try {
    const bookings = await classroomBookingCollection.find({ userEmail: req.params.email }).sort({ createdAt: -1 }).toArray();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user bookings', error: error.message });
  }
});

// Create classroom booking
app.post('/api/classroom-bookings', async (req, res) => {
  try {
    const newBooking = {
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const result = await classroomBookingCollection.insertOne(newBooking);
    res.status(201).json({ message: 'Classroom booking created successfully', bookingId: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

// Update booking status
app.put('/api/classroom-bookings/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await classroomBookingCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date().toISOString() } }
    );
    if (result.matchedCount > 0) {
      res.json({ message: 'Booking status updated successfully' });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
});

// Delete classroom booking
app.delete('/api/classroom-bookings/:id', async (req, res) => {
  try {
    const result = await classroomBookingCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount > 0) {
      res.json({ message: 'Booking deleted successfully' });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  }
});

// ========== LAB BOOKING ROUTES ==========

// Get all lab bookings
app.get('/api/lab-bookings', async (req, res) => {
  try {
    const bookings = await labBookingCollection.find().sort({ createdAt: -1 }).toArray();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lab bookings', error: error.message });
  }
});

// Get lab bookings by user email
app.get('/api/lab-bookings/user/:email', async (req, res) => {
  try {
    const bookings = await labBookingCollection.find({ userEmail: req.params.email }).sort({ createdAt: -1 }).toArray();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user lab bookings', error: error.message });
  }
});

// Create lab booking
app.post('/api/lab-bookings', async (req, res) => {
  try {
    const newBooking = {
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const result = await labBookingCollection.insertOne(newBooking);
    res.status(201).json({ message: 'Lab booking created successfully', bookingId: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating lab booking', error: error.message });
  }
});

// Update lab booking status
app.put('/api/lab-bookings/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await labBookingCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date().toISOString() } }
    );
    if (result.matchedCount > 0) {
      res.json({ message: 'Lab booking status updated successfully' });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating lab booking', error: error.message });
  }
});

// Delete lab booking
app.delete('/api/lab-bookings/:id', async (req, res) => {
  try {
    const result = await labBookingCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount > 0) {
      res.json({ message: 'Lab booking deleted successfully' });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lab booking', error: error.message });
  }
});

// ========== USER DASHBOARD ROUTES ==========

// Get user's all bookings (classroom + lab)
app.get('/api/user-dashboard/:email', async (req, res) => {
  try {
    const classroomBookings = await classroomBookingCollection.find({ userEmail: req.params.email }).sort({ createdAt: -1 }).toArray();
    const labBookings = await labBookingCollection.find({ userEmail: req.params.email }).sort({ createdAt: -1 }).toArray();
    
    res.json({
      classroomBookings: classroomBookings.map(b => ({ ...b, type: 'classroom' })),
      labBookings: labBookings.map(b => ({ ...b, type: 'lab' })),
      totalBookings: classroomBookings.length + labBookings.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user dashboard', error: error.message });
  }
});

// ========== GALLERY ROUTES ==========

// Get all gallery photos
app.get('/api/gallery', async (req, res) => {
  try {
    const photos = await galleryCollection.find().sort({ createdAt: -1 }).toArray();
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gallery photos', error: error.message });
  }
});

// Get gallery photos by category
app.get('/api/gallery/category/:category', async (req, res) => {
  try {
    const photos = await galleryCollection.find({ category: req.params.category }).sort({ createdAt: -1 }).toArray();
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gallery photos', error: error.message });
  }
});

// Add new photo to gallery
app.post('/api/gallery', async (req, res) => {
  try {
    const newPhoto = {
      ...req.body,
      createdAt: new Date().toISOString()
    };
    const result = await galleryCollection.insertOne(newPhoto);
    res.status(201).json({ message: 'Photo added to gallery successfully', photoId: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: 'Error adding photo to gallery', error: error.message });
  }
});

// Delete photo from gallery
app.delete('/api/gallery/:id', async (req, res) => {
  try {
    const result = await galleryCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount > 0) {
      res.json({ message: 'Photo deleted successfully' });
    } else {
      res.status(404).json({ message: 'Photo not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting photo', error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🎓 JNU CSE Portal Server Started on http://localhost:${PORT}`);
});
