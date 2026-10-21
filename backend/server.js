const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// Welcome endpoint
app.get("/", (req, res) => {
    res.json({ message: "Welcome to IssueFlow API" });
});

// GET: Retrieve all issues
app.get("/api/issues", (req, res) => {
    db.query("SELECT * FROM issues", (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        res.json(results);
    });
});

// GET: Retrieve one issue
app.get("/api/issues/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid issue ID" });
    }

    db.query(
        "SELECT * FROM issues WHERE id = ?",
        [id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Database error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Issue not found" });
            }

            res.json(results[0]);
        }
    );
});

// POST: Create an issue
app.post("/api/issues", (req, res) => {
    const { title, priority } = req.body;

    const validPriorities = ["Low", "Medium", "High"];

    if (
        typeof title !== "string" ||
        !title.trim() ||
        !validPriorities.includes(priority)
    ) {
        return res.status(400).json({
            message: "A title and valid priority (Low, Medium, High) are required"
        });
    }

    db.query(
        "INSERT INTO issues (title, priority, status) VALUES (?, ?, ?)",
        [title.trim(), priority, "Open"],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Database error" });
            }

            res.status(201).json({
                message: "Issue created successfully",
                id: result.insertId,
                title: title.trim(),
                priority,
                status: "Open"
            });
        }
    );
});

// PUT: Update an issue
app.put("/api/issues/:id", (req, res) => {
    const id = Number(req.params.id);
    const { title, priority, status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid issue ID" });
    }

    const allowedStatuses = ["Open", "In Progress", "Resolved"];
    const validPriorities = ["Low", "Medium", "High"];

    if (
        (title !== undefined &&
            (typeof title !== "string" || !title.trim())) ||
        (priority !== undefined && !validPriorities.includes(priority)) ||
        (status !== undefined && !allowedStatuses.includes(status))
    ) {
        return res.status(400).json({ message: "Invalid update data" });
    }

    if (title === undefined && priority === undefined && status === undefined) {
        return res.status(400).json({ message: "No fields provided to update" });
    }

    db.query("SELECT * FROM issues WHERE id = ?", [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Issue not found" });
        }

        const current = results[0];

        const updated = {
            title: title === undefined ? current.title : title.trim(),
            priority: priority === undefined ? current.priority : priority,
            status: status === undefined ? current.status : status
        };

        db.query(
            "UPDATE issues SET title = ?, priority = ?, status = ? WHERE id = ?",
            [updated.title, updated.priority, updated.status, id],
            (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ message: "Database error" });
                }

                res.json({
                    message: "Issue updated successfully",
                    id,
                    ...updated
                });
            }
        );
    });
});

// DELETE: Remove an issue
app.delete("/api/issues/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid issue ID" });
    }

    db.query("DELETE FROM issues WHERE id = ?", [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Issue not found" });
        }

        res.json({ message: "Issue deleted successfully", id });
    });
});

app.listen(3000, () => {
    console.log("IssueFlow server running on port 3000");
});
