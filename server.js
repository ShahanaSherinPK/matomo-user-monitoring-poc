require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");

const app = express();

const db = new sqlite3.Database("./users.db");

const JWT_SECRET = "matomo-poc-secret-key";

const PORT = 3003;
const sessions = new Map();
console.log("Matomo token loaded:", !!process.env.MATOMO_TOKEN);

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send("Matomo Monitoring POC is running");
});

app.get("/matomo-users", async (req, res) => {
    try {
        const response = await fetch("http://localhost:8080/index.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                module: "API",
                method: "Live.getLastVisitsDetails",
                idSite: "1",
                period: "day",
                date: "today",
                format: "JSON",
                filter_limit: "10",
                token_auth: process.env.MATOMO_TOKEN
            })
        });

        const data = await response.json();

        res.json(data);

    } catch (error) {
        console.error("Matomo API error:", error);

        res.status(500).json({
            message: "Failed to fetch Matomo data"
        });
    }
});
app.get("/matomo-realtime", async (req, res) => {
    try {
        const response = await fetch("http://localhost:8080/index.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                module: "API",
                method: "Live.getLastVisitsDetails",
                idSite: "1",
                period: "day",
                date: "today",
                format: "JSON",
                filter_limit: "10",
                token_auth: process.env.MATOMO_TOKEN
            })
        });

        const data = await response.json();

        res.json(data);

    } catch (error) {
        console.error("Matomo realtime error:", error);

        res.status(500).json({
            message: "Failed to fetch real-time Matomo data"
        });
    }
});
app.get("/matomo-user-history", async (req, res) => {
    try {
        const userId = req.query.userId;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        if (!userId) {
            return res.status(400).json({
                message: "userId is required"
            });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({
                message: "startDate and endDate are required"
            });
        }

        const response = await fetch("http://localhost:8080/index.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                module: "API",
                method: "Live.getLastVisitsDetails",
                idSite: "1",
                period: "range",
                date: `${startDate},${endDate}`,
                segment: `userId==${userId}`,
                format: "JSON",
                filter_limit: "100",
                token_auth: process.env.MATOMO_TOKEN
            })
        });

        const data = await response.json();

        res.json(data);

    } catch (error) {
        console.error("User history error:", error);

        res.status(500).json({
            message: "Failed to load user history"
        });
    }
});

function authenticateToken(req, res, next) {

    const authHeader = req.headers["authorization"];

    const token =
        authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access token required"
        });
    }

    jwt.verify(
        token,
        JWT_SECRET,
        (err, user) => {

            if (err) {
                return res.status(403).json({
                    message: "Invalid or expired token"
                });
            }

            req.user = user;

            next();
        }
    );
}
app.get("/matomo-active-users", async (req, res) => {

    try {

        const response = await fetch("http://localhost:8080/index.php", {
            method: "POST",

            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },

            body: new URLSearchParams({
                module: "API",
                method: "Live.getLastVisitsDetails",
                idSite: "1",
                period: "day",
                date: "today",
                format: "JSON",
                filter_limit: "100",
                token_auth: process.env.MATOMO_TOKEN
            })
        });


        const data = await response.json();


        // Users are considered recently active
        // if their last activity was within 3 minutes.

        const threeMinutesAgo =
            Date.now() - (3 * 60 * 1000);


        const activeUsers = data

    .filter(visit => {

        if (
            !visit.userId ||
            !visit.lastActionTimestamp
        ) {
            return false;
        }

     const lastActivity =
            visit.lastActionTimestamp * 1000;

        // Must have recent activity
        if (lastActivity < threeMinutesAgo) {
            return false;
        }

        // Do not show users whose latest activity is logout
        const actionDetails =
            visit.actionDetails || [];

        let latestAction = null;

        actionDetails.forEach(action => {

            if (!action.timestamp) {
                return;
            }

            if (
                !latestAction ||
                action.timestamp > latestAction.timestamp
            ) {
                latestAction = action;
            }

        });

        if (
            latestAction &&
            latestAction.type === "event" &&
            (
                latestAction.eventAction === "User logged out" ||
                latestAction.eventName === "User logged out"
            )
        ) {
            return false;
        }

        return true;

    })


            .map(visit => {

                const actionDetails =
                    visit.actionDetails || [];


                // Find the most recent action
                let latestAction = null;


                actionDetails.forEach(action => {

                    if (!action.timestamp) {
                        return;
                    }


                    if (
                        !latestAction ||
                        action.timestamp > latestAction.timestamp
                    ) {

                        latestAction = action;

                    }

                });


                let activity = "Unknown";


                if (latestAction) {

                    if (latestAction.type === "event") {

                        activity =
                            latestAction.eventAction ||
                            latestAction.eventName ||
                            "Event";

                    }

                    else if (latestAction.type === "action") {

                        activity =
                            latestAction.pageTitle ||
                            "Page View";

                    }

                }


                return {

                    userId: visit.userId,

                    lastActivity: new Date(
                        visit.lastActionTimestamp * 1000
                    ).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata"
                    }),

                    activity: activity

                };

            });


        res.json(activeUsers);


    } catch (error) {

        console.error(
            "Active users error:",
            error
        );


        res.status(500).json({

            message:
                "Failed to load active users"

        });

    }

});
async function trackActivity(userId, activity, visitorId) {

    const response = await fetch("http://localhost:8080/matomo.php", {
        method: "POST",

        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },

        body: new URLSearchParams({
            idsite: "1",
            rec: "1",
            uid: userId,
            _id: visitorId,
            url: "http://localhost:3003/dashboard.html",
            action_name: activity,
            e_c: "Application",
            e_a: activity,
            e_n: activity,
            rand: Date.now().toString(),
            apiv: "1",
            send_image: "0",
            bots: "1",
            queuedtracking: "0"
        })
    });

    console.log("Matomo event status:", response.status);

    if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        console.error("Matomo tracking failed:", errorText);

        throw new Error("Matomo tracking failed");
    }
}
app.post("/equipment", authenticateToken, async (req, res) => {

    try {

        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Equipment name is required"
            });
        }

        console.log(
            `Equipment creation requested by: ${req.user.userId}`
        );
        

        // Simulate successful equipment creation
        const equipment = {
            id: Date.now(),
            name: name
        };
        
        console.log(
            `Equipment created successfully: ${equipment.name}`
        );
        const visitorId = crypto
    .createHash("md5")
    .update(req.user.userId)
    .digest("hex")
    .substring(0, 16);

await trackActivity(
    req.user.userId,
    "Equipment created",
    visitorId
);

        res.json({
            success: true,
            message: "Equipment created successfully",
            equipment: equipment
        });

    } catch (error) {

        console.error("Equipment creation error:", error);

        res.status(500).json({
            message: "Failed to create equipment"
        });
    }
});

app.put("/equipment/:id", authenticateToken, async (req, res) => {

    try {

        const equipmentId = req.params.id;

        console.log(
            `Equipment update requested by: ${req.user.userId}`
        );

        // Simulate successful equipment update
        const equipment = {
            id: equipmentId,
            name: "Updated Equipment"
        };

        console.log(
            `Equipment updated successfully: ${equipment.name}`
        );

        const visitorId = crypto
            .createHash("md5")
            .update(req.user.userId)
            .digest("hex")
            .substring(0, 16);

        await trackActivity(
            req.user.userId,
            "Equipment updated",
            visitorId
        );

        res.json({
            success: true,
            message: "Equipment updated successfully",
            equipment: equipment
        });

    } catch (error) {

        console.error("Equipment update error:", error);

        res.status(500).json({
            message: "Failed to update equipment"
        });
    }
});

app.delete("/equipment/:id", authenticateToken, async (req, res) => {

    try {

        const equipmentId = req.params.id;

        console.log(
            `Equipment deletion requested by: ${req.user.userId}`
        );

        // Simulate successful equipment deletion
        console.log(
            `Equipment deleted successfully: ${equipmentId}`
        );

        const visitorId = crypto
            .createHash("md5")
            .update(req.user.userId)
            .digest("hex")
            .substring(0, 16);

        await trackActivity(
            req.user.userId,
            "Equipment deleted",
            visitorId
        );

        res.json({
            success: true,
            message: "Equipment deleted successfully"
        });

    } catch (error) {

        console.error("Equipment deletion error:", error);

        res.status(500).json({
            message: "Failed to delete equipment"
        });
    }
});

app.post("/activity", authenticateToken, async (req, res) => {
    try {
        const { activity } = req.body;

if (!activity) {
    return res.status(400).json({
        message: "activity is required"
    });
}

const authenticatedUserId = req.user.userId;
const visitorId = crypto
    .createHash("md5")
    .update(authenticatedUserId)
    .digest("hex")
    .substring(0, 16);

        // Backend confirmed the activity
     console.log(
    `Backend confirmed activity: ${authenticatedUserId} - ${activity}`
);
 const response = await fetch("http://localhost:8080/matomo.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                idsite: "1",
                rec: "1",

                // Application user ID
               uid: authenticatedUserId,
               _id: visitorId,

                // Activity information
                url: "http://localhost:3003/dashboard.html",
                action_name: activity,

                e_c: "Application",
                e_a: activity,
                e_n: activity,

                // Prevent caching
                rand: Date.now().toString(),

                // Tracking API version
                apiv: "1",

                // Return HTTP 204 instead of GIF
                send_image: "0",
                bots: "1",
                queuedtracking: "0"
            })
        });

        console.log("Matomo HTTP status:", response.status);

        if (!response.ok && response.status !== 204) {
            const errorText = await response.text();

            console.error("Matomo tracking failed:", errorText);

            return res.status(500).json({
                message: "Matomo tracking failed"
            });
        }

        res.json({
            success: true,
            message: "Activity sent to Matomo"
        });

    } catch (error) {
        console.error("Activity tracking error:", error);

        res.status(500).json({
            message: "Failed to track activity"
        });
    }
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    db.get(
        `SELECT user_id, username, email, role, password
         FROM users
         WHERE username = ?`,
        [username],
        async (err, user) => {
       

            if (err) {
                console.error("Database error:", err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (!user || user.password !== password) {
                return res.status(401).json({
                    message: "Invalid username or password"
                });
            }

            const token = jwt.sign(
                {
                    userId: user.user_id,
                    role: user.role,
                    email: user.email
                },
                JWT_SECRET,
                {
                    expiresIn: "1h"
                }
            );

            await trackActivity(
            user.user_id,
            "User logged in",
            crypto
                .createHash("md5")
                .update(user.user_id)
                .digest("hex")
                .substring(0, 16)
            );

            console.log("Authenticated user:", {
                userId: user.user_id,
                role: user.role,
                email: user.email
            });

            res.json({
                success: true,
                accessToken: token
            });
        }
    );
});
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});