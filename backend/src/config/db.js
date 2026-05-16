import mongoose from 'mongoose'

async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing from environment variables.')
  }

  const connection = await mongoose.connect(process.env.MONGO_URI)
  console.log(`MongoDB connected: ${connection.connection.host}`)
}

export default connectDB
