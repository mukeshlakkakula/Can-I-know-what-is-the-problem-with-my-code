const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertCamelCasePlayer = (playerArray) => {
  return {
    playerId: playerArray.player_id,
    playerName: playerArray.player_name,
  };
};

const convertArrayObj = (playerIdArray) => {
  return {
    matchId: playerIdArray.match_id,
    match: playerIdArray.match,
    year: playerIdArray.year,
  };
};

app.get("/players/", async (request, response) => {
  const playerQuery = `SELECT player_id AS playerId,player_name	AS playerName FROM 
    player_details;`;
  const playerArray = await db.all(playerQuery);
  response.send(playerArray);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerIdQuery = `SELECT * FROM 
    player_details WHERE player_id = ${playerId};`;
  const playerArray = await db.get(playerIdQuery);
  response.send({
    playerId: playerArray.player_id,
    playerName: playerArray.player_name,
  });
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const playerIdQuery = `UPDATE player_details SET player_name='${playerName}'
  WHERE player_id = ${playerId}`;
  const playerArray = await db.run(playerIdQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const playerIdQuery = `SELECT * FROM match_details WHERE 
  match_id = ${matchId}`;
  const playerArray = await db.get(playerIdQuery);
  response.send({
    matchId: playerArray.match_id,
    match: playerArray.match,
    year: playerArray.year,
  });
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const playerIdQuery = `SELECT * FROM player_match_score
    LEFT JOIN  match_details 
   ON match_details.
  match_id =  player_match_score.player_match_id 
  WHERE player_match_score.player_id =${playerId}`;
  const playerArray = await db.all(playerIdQuery);
  response.send(playerArray.map((newOne) => convertArrayObj(newOne)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const playerIdQuery = `SELECT * FROM player_match_score
    LEFT JOIN  player_details 
   ON player_match_score.player_id  = player_details.
 player_id
  WHERE player_match_score.match_id =${matchId};`;
  const playerArray = await db.all(playerIdQuery);
  response.send(playerArray.map((newOne) => convertCamelCasePlayer(newOne)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  try {
    const { playerId } = request.params;

    const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
    const playerArray = await db.all(getPlayerScored);
    response.send(playerArray);
  } catch (e) {
    console.log(e);
  }
});

module.exports = app;
