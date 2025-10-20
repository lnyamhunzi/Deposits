import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import MySQLStore from "express-mysql-session";
import { pool } from "./db.js";
import { storage } from "./storage.js";
import type { User } from "@shared/schema";

const MySQLSessionStore = MySQLStore(session);

const sessionStore = new MySQLSessionStore(
  {
    clearExpired: true,
    checkExpirationInterval: 900000, // How frequently expired sessions will be cleared; milliseconds.
    expiration: 86400000, // The maximum age of a valid session; milliseconds.
    createDatabaseTable: true, // Whether or not to create the sessions database table, if one does not already exist.
    schema: {
      tableName: "sessions",
      columnNames: {
        session_id: "session_id",
        expires: "expires",
        data: "data",
      },
    },
  },
  pool
);

// Add user to request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function setupAuth(app: Express) {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "development-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

  // Attach user to request
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if ((req.session as any).userId) {
      const user = await storage.getUser((req.session as any).userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  });

  // Development login endpoint
  app.get("/api/login", async (req: Request, res: Response) => {
    try {
      // Create/get demo user
      let user = await storage.getUserByEmail("admin@qsight.co.zw");
      
      if (!user) {
        user = await storage.upsertUser({
          id: "demo-admin-001",
          email: "admin@qsight.co.zw",
          firstName: "System",
          lastName: "Administrator",
          profileImageUrl: null,
          role: "admin",
        });
      }

      (req.session as any).userId = user.id;
      res.redirect("/");
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout route
  app.get("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.redirect("/");
    });
  });

  // Get current user
  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Middleware to require specific role
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
