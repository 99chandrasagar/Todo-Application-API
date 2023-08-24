const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initalizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Error at Database ${e.message}`);
    process.exit(1);
  }
};

initalizeDBAndServer();

//status property
const hasStatusProperty = (queryvalue) => {
  return queryvalue.status !== undefined;
};

//Priority property
const hasPriorityProperty = (priorityquery) => {
  return priorityquery.priority !== undefined;
};

//priority and status property
const hasStatusPriority = (staprio) => {
  return staprio.priority !== undefined && staprio.status !== undefined;
};

//search_q property
const hasSearch = (each) => {
  return each.search_q !== undefined;
};

//Returns a list of all todos whose status is 'TO DO'
app.get("/todos/", async (request, response) => {
  let data = null;
  let getQuery = "";
  const { status, priority, search_q = "" } = request.query;
  switch (true) {
    case hasStatusProperty(request.query):
      getQuery = `
        select * from todo
        where status = '${status}'
        and todo like '%${search_q}%';`;

      break;

    case hasPriorityProperty(request.query):
      getQuery = `
        select * from todo
        where todo like '%${search_q}%' 
        and
        priority = '${priority}'`;
      break;

    case hasStatusPriority(request.query):
      getQuery = `
        select * from todo
        where and todo like '%${search_q}%' and priority = '${priority}' and status = '${status}'`;
      break;

    case hasSearch(request.query):
      getQuery = `
        select * from todo
        where todo like '%${search_q}%'`;
      break;

    default:
      response.send("Default Value");
      break;
  }
  data = await db.all(getQuery);
  response.send(data);
});

//API2 Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const queryId = `
    select * from todo
    where id = ${todoId}`;
  const basedId = await db.get(queryId);
  response.send(basedId);
});

//API3 Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const postQuery = `
    insert into todo (id, todo, priority, status)
    values
    (
        ${id}, '${todo}', '${priority}', '${status}' )`;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
});

//API4 Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateCoulmn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateCoulmn = "Status";
      break;

    case requestBody.priority !== undefined:
      updateCoulmn = "Priority";
      break;

    case requestBody.todo !== undefined:
      updateCoulmn = "Todo";
      break;
  }

  const previousTodoQuery = `
  select * from todo
  where id = ${todoId}`;
  const previoustodo = await db.get(previousTodoQuery);

  const {
    todo = previoustodo.todo,
    priority = previoustodo.priority,
    status = previoustodo.status,
  } = request.body;

  const updateQuery = `
  update todo set
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}'
  where 
  id = ${todoId}`;
  await db.run(updateQuery);
  response.send(`${updateCoulmn} Updated`);
});

//API5 Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const delQUery = `
    delete from todo
    where id = ${todoId}`;
  await db.run(delQUery);
  response.send("Todo Deleted");
});

module.exports = app;
