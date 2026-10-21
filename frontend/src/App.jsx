
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:3000/api/issues";

function App() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [formMessage, setFormMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch all issues from the backend.
  async function fetchIssues() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch issues");
      }

      const data = await response.json();
      setIssues(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        "Could not connect to the backend. Is the server running?"
      );
    } finally {
      setLoading(false);
    }
  }

  // Create a new issue.
  async function createIssue(event) {
    event.preventDefault();

    if (!title.trim()) {
      setFormMessage("Please enter an issue title.");
      return;
    }

    try {
      setSubmitting(true);
      setFormMessage("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          priority,
          status: "Open",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Could not create issue"
        );
      }

      setTitle("");
      setPriority("Medium");
      setFormMessage("Issue created successfully!");

      await fetchIssues();
    } catch (err) {
      console.error("Create issue error:", err);
      setFormMessage(
        err.message || "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }
  
  // Update an existing issue's status.
  async function updateIssueStatus(issue, newStatus) {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/${issue.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: issue.title,
            priority: issue.priority,
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not update issue status");
      }

      await fetchIssues();
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message);
    }
  }

  // Delete an issue.
  async function deleteIssue(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this issue?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Could not delete issue");
      }

      await fetchIssues();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message);
    }
  }


  // Load issues when the component first mounts.
  useEffect(() => {
    let ignore = false;

    async function loadIssues() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch issues");
        }

        const data = await response.json();

        if (!ignore) {
          setIssues(data);
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          console.error("Initial load error:", err);
          setError(
            "Could not connect to the backend. Is the server running?"
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadIssues();

    return () => {
      ignore = true;
    };
  }, []);

  // Calculate dashboard statistics.
  const totalIssues = issues.length;

  const openIssues = issues.filter(
    (issue) => issue.status === "Open"
  ).length;

  const highPriorityIssues = issues.filter(
    (issue) => issue.priority === "High"
  ).length;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div>
          <h1>IssueFlow</h1>
          <p>Bug & Issue Tracking System</p>
        </div>

        <span className="badge">
          Developer Dashboard
        </span>
      </header>

      <main className="container">
        {/* Dashboard heading */}
        <section className="welcome">
          <div>
            <h2>Issue Dashboard</h2>
            <p>
              Track, manage, and resolve reported issues.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchIssues}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Issues"}
          </button>
        </section>

        {/* Statistics */}
        <section className="stats">
          <div className="stat-card">
            <span>Total Issues</span>
            <h2>{totalIssues}</h2>
          </div>

          <div className="stat-card">
            <span>Open Issues</span>
            <h2>{openIssues}</h2>
          </div>

          <div className="stat-card">
            <span>High Priority</span>
            <h2>{highPriorityIssues}</h2>
          </div>
        </section>

        {/* Create Issue Form */}
        <section className="issues-section create-section">
          <h2>Report a New Issue</h2>

          <form
            onSubmit={createIssue}
            className="issue-form"
          >
            <div className="form-field">
              <label htmlFor="title">
                Issue Title
              </label>

              <input
                id="title"
                type="text"
                placeholder="e.g. Login button not working"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="priority">
                Priority
              </label>

              <select
                id="priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Create Issue"}
            </button>
          </form>

          {formMessage && (
            <p role="status">{formMessage}</p>
          )}
        </section>

        {/* Issues Table */}
        <section className="issues-section">
          <h2>All Issues</h2>

          {loading && (
            <p>Loading issues...</p>
          )}

          {error && (
            <p className="error">{error}</p>
          )}

          {!loading &&
            !error &&
            issues.length === 0 && (
              <p>No issues found.</p>
            )}

          {!loading &&
            !error &&
            issues.length > 0 && (
              <div className="table-wrapper">
               
<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Issue Title</th>
      <th>Priority</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>

  <tbody>
    {issues.map((issue) => (
      <tr key={issue.id}>
        <td>#{issue.id}</td>

        <td>{issue.title}</td>

        <td>
          <span
            className={`priority ${issue.priority.toLowerCase()}`}
          >
            {issue.priority}
          </span>
        </td>

        <td>
          <select
            value={issue.status}
            onChange={(event) =>
              updateIssueStatus(
                issue,
                event.target.value
              )
            }
            aria-label={`Status for issue ${issue.id}`}
          >
            <option value="Open">Open</option>
            <option value="In Progress">
              In Progress
            </option>
            <option value="Resolved">
              Resolved
            </option>
          </select>
        </td>

        <td>
          <button
            type="button"
            className="delete-btn"
            onClick={() => deleteIssue(issue.id)}
          >
            Delete
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

              </div>
            )}
        </section>
      </main>
    </div>
  );
}

export default App;
