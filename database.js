const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./users.db");

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            password TEXT NOT NULL
        )
    `);

    const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users
        (user_id, username, email, role, password)
        VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run(
        "user010",
        "user010",
        "user010@example.com",
        "user",
        "password123"
    );

    insertUser.run(
        "user011",
        "user011",
        "user011@example.com",
        "user",
        "password123"
    );

    insertUser.run(
        "user012",
        "user012",
        "user012@example.com",
        "admin",
        "password123"
    );

    insertUser.finalize();

    console.log("Users database initialized.");
});

db.close();