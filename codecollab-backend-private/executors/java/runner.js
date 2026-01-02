const express = require("express");
const bodyParser = require("body-parser");
const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

app.get("/health", (req, res) => res.send("Java Runner OK"));

app.post("/execute", async (req, res) => {
  const { code, input } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  // Java requires class name to match file name. We assume "Main"
  const fileName = "Main.java";
  const filePath = path.join(__dirname, fileName);
  const classPath = path.join(__dirname, "Main.class");

  fs.writeFileSync(filePath, code);

  const start = Date.now();
  let stdout = "";
  let stderr = "";
  let isTimedOut = false;

  // Compile
  exec(
    "javac Main.java",
    { cwd: __dirname },
    (error, compileOut, compileErr) => {
      if (error) {
        fs.unlink(filePath, () => {});
        return res.json({
          status: "COMPILATION_ERROR",
          output: "",
          error: compileErr || error.message,
          exitCode: 1,
          executionTime: 0,
        });
      }

      // Run
      const child = spawn("java", ["Main"], { cwd: __dirname });

      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      }

      child.stdout.on("data", (data) => (stdout += data.toString()));
      child.stderr.on("data", (data) => (stderr += data.toString()));

      const timeout = setTimeout(() => {
        isTimedOut = true;
        child.kill("SIGKILL");
      }, 10000);

      child.on("close", (code) => {
        clearTimeout(timeout);
        const duration = Date.now() - start;

        // Cleanup
        fs.unlink(filePath, () => {});
        fs.unlink(classPath, () => {});

        if (isTimedOut) {
          return res.json({
            status: "TIMEOUT",
            output: stdout,
            error: "Execution time limit exceeded",
            executionTime: 10000,
          });
        }

        res.json({
          status: code === 0 ? "COMPLETED" : "FAILED",
          output: stdout,
          error: stderr,
          exitCode: code,
          executionTime: duration,
        });
      });
    }
  );
});

app.listen(PORT, () => console.log(`Java Runner on ${PORT}`));
