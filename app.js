const express = require("express");
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const { open } = sqlite;
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBandServer = async () => {
  try {
    app.listen(3000, () => {
      console.log("Server Running on Port 3000");
    });
    db = await open({ filename: dbPath, driver: sqlite3.Database });
  } catch (error) {
    console.log(`DB Encountered Error :${e.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

const conversionOfDBObjectToResponseObjectForAPI0 = (dbObject) => {
  return {
    username: dbObject.username,
    name: dbObject.name,
    password: dbObject.password,
    gender: dbObject.gender,
    location: dbObject.location,
  };
};

// API-1 Get All Users

app.get("/users", async (request, response) => {
  const getUsersQuery = `
                            select
                                *
                            from
                                user
                            ;`;
  const usersArray = await db.all(getUsersQuery);
  const responseUsersArray = usersArray.map((eachUser) =>
    conversionOfDBObjectToResponseObjectForAPI0(eachUser)
  );
  response.send(responseUsersArray);
});

// API-1 To Register the User

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  //   console.log(password.length);
  //Check if User Exists
  const checkForUserQuery = `
                            select
                                *
                            from
                                user
                            where 
                                username like '%${username}%'
                            ;`;
  const usersInDatabase = await db.all(checkForUserQuery);
  //   console.log(usersInDatabase);
  if (usersInDatabase.length === 0) {
    // console.log(length(password));
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      //   console.log(hashedPassword);
      const registeringUserQuery = `
                            insert into user
                                (username, name, password, gender, location)
                            values
                                ('${username}', '${name}','${hashedPassword}','${gender}','${location}')
                            ;
                            `;
      await db.run(registeringUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    // console.log("User Exists");
    response.status(400);
    response.send("User already exists");
  }
});

// API-2 To Login the User

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  console.log(request.body.username);
  //Check if User Exists
  const checkForUserQuery = `
                            select
                                *
                            from
                                user
                            where 
                                username like '${username}'
                            ;`;
  const usersInDatabase = await db.get(checkForUserQuery);
  console.log(usersInDatabase);
  if (usersInDatabase !== undefined) {
    const checkForPasswordMatch = await bcrypt.compare(
      password,
      usersInDatabase.password
    );
    // const checkForPasswordMatch = userDataFromDatabase[0].password === password;
    // console.log(checkForPasswordMatch);
    if (checkForPasswordMatch) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    // console.log("User Exists");
    response.status(400);
    response.send("Invalid user");
  }̥
});

// API-3 To Change the Password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  //Check for Password Match
  const userDataFromDatabaseQuery = `
                            select
                                password
                            from
                                user
                            where 
                                username like '%${username}%'
                            ;`;
  const userDataFromDatabase = await db.all(userDataFromDatabaseQuery);
  //   console.log(userDataFromDatabase);
  const checkForPasswordMatch = await bcrypt.compare(
    oldPassword,
    userDataFromDatabase[0].password
  );
  //   console.log(userDataFromDatabase[0].password);
  //   console.log(oldPassword);
  //   console.log(checkForPasswordMatch);
  if (checkForPasswordMatch) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateUserPasswordInDatabaseQuery = `
                            update user
                                set password = '${hashedPassword}'
                            where 
                                username like '%${username}%'
                            ;`;
      await db.all(updateUserPasswordInDatabaseQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
