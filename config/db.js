const mongoose = require('mongoose');
const dns = require('dns');

// mongodb+srv:// needs an SRV DNS lookup. Some networks (campus Wi-Fi, VPNs,
// corporate firewalls) refuse those queries -> "querySrv ECONNREFUSED".
// Forcing public DNS resolvers for Node's lookups fixes it in most cases.
try {
  dns.setServers(['1.1.1.1', '8.8.8.8', ...dns.getServers()]);
} catch (_) { /* ignore */ }

/**
 * Cached connection helper.
 *
 * On a normal server `connectDB()` runs once at boot. On a serverless
 * platform (Vercel) the module can be re-evaluated between invocations, so we
 * cache the connection on the global object to avoid opening a new pool on
 * every request.
 */
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Create a .env file (see .env.example) with your MongoDB connection string.'
    );
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose
      .connect(uri, {
        // keep the pool small – serverless functions are short lived
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000
      })
      .then((m) => {
        console.log('✅ MongoDB connected');
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow a retry on the next request
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
