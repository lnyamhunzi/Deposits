import session from "express-session";
import MySQLStore from "express-mysql-session";
import { pool } from "./db.js";
import { storage } from "./storage.js";
const MySQLSessionStore = MySQLStore(session);
const sessionStore = new MySQLSessionStore(
  {
    clearExpired: true,
    checkExpirationInterval: 9e5,
    // How frequently expired sessions will be cleared; milliseconds.
    expiration: 864e5,
    // The maximum age of a valid session; milliseconds.
    createDatabaseTable: true,
    // Whether or not to create the sessions database table, if one does not already exist.
    schema: {
      tableName: "sessions",
      columnNames: {
        session_id: "session_id",
        expires: "expires",
        data: "data"
      }
    }
  },
  pool
);
function setupAuth(app) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "development-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1e3,
        // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      }
    })
  );
  app.use(async (req, res, next) => {
    if (req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  });
  app.get("/api/login", async (req, res) => {
    try {
      let user = await storage.getUserByEmail("admin@qsight.co.zw");
      if (!user) {
        user = await storage.upsertUser({
          id: "demo-admin-001",
          email: "admin@qsight.co.zw",
          firstName: "System",
          lastName: "Administrator",
          profileImageUrl: null,
          role: "admin"
        });
      }
      req.session.userId = user.id;
      res.redirect("/");
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.redirect("/");
    });
  });
  app.get("/api/auth/user", (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
}
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
export {
  requireAuth,
  requireRole,
  setupAuth
};
