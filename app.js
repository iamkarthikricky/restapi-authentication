const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const UserExistQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const isUserExists = await database.get(UserExistQuery);

  if (isUserExists !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    const isPasswordLength = password.length;
    if (isPasswordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newUserQuery = `INSERT INTO 
                user (username, name, password, gender, location) VALUES
                ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}')`;
      const dbResponse = await database.run(newUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const UserExistQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const isUserExists = await database.get(UserExistQuery);
  if (isUserExists == undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      isUserExists.password
    );
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const UserExistQuery = `SELECT * FROM user WHERE username = '${username}';`;

  const isUserExists = await database.get(UserExistQuery);

  const isPasswordMatched = await bcrypt.compare(
    oldPassword,
    isUserExists.password
  );
  if (isPasswordMatched == false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    const isPasswordLength = newPassword.length;
    if (isPasswordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `UPDATE user SET password = '${hashedPassword}' WHERE username ='${username}'`;

      await database.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;
