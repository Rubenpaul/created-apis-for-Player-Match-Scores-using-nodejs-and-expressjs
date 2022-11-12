const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDBAndServer();

//ADD GET Players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT 
            * 
        FROM 
            player_details
    `;
  const convertDBObjToResponseObj = (playerObj) => {
    return {
      playerId: playerObj.player_id,
      playerName: playerObj.player_name,
    };
  };

  let playersArray = [];
  const playersObjArray = await db.all(getPlayersQuery);
  for (let player of playersObjArray) {
    playersArray.push(convertDBObjToResponseObj(player));
  }
  response.send(playersArray);
});

//ADD GET Player API
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT 
            * 
        FROM 
            player_details 
        WHERE
            player_id = ${playerId}
    `;
  const convertDBObjToResponseObj = (playerObj) => {
    return {
      playerId: playerObj.player_id,
      playerName: playerObj.player_name,
    };
  };
  const playerObj = await db.get(getPlayerQuery);
  const player = convertDBObjToResponseObj(playerObj);
  response.send(player);
});

//ADD PUT Player API
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayerDetailsQuery = `
        UPDATE 
            player_details
        SET 
            player_name  = "${playerName}"
        WHERE
            player_id = ${playerId}
    `;
  await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

//ADD GET Match API

app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const convertDBObjToResponseObj = (matchObj) => {
    return {
      matchId: matchObj.match_id,
      match: matchObj.match,
      year: matchObj.year,
    };
  };
  const getMatchesQuery = `
        SELECT 
            * 
        FROM 
            match_details
        WHERE 
            match_id = ${matchId}
    `;
  const matchesArrayObj = await db.get(getMatchesQuery);
  const matchesArray = convertDBObjToResponseObj(matchesArrayObj);
  response.send(matchesArray);
});

//ADD GET List Of all matches of a Player API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getListOfMatchesOfaPlayerQuery = `
        SELECT 
           player_match_score.match_id AS  matchId,
           match AS match,
           year AS year
        FROM 
            match_details INNER JOIN player_match_score  
            ON match_details.match_id = player_match_score.match_id
        WHERE 
            player_id = ${playerId}
    `;
  const playerMatchesArray = await db.all(getListOfMatchesOfaPlayerQuery);
  response.send(playerMatchesArray);
});

//ADD GET Players for A Match API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersForAMatchQuery = `
        SELECT 
            player_match_score.player_id AS playerId,
            player_name AS playerName
        FROM 
            player_details INNER JOIN player_match_score 
            ON player_details.player_id = player_match_score.player_id
        WHERE
            match_id = ${matchId}
    `;
  const playersArrayObj = await db.all(getPlayersForAMatchQuery);
  response.send(playersArrayObj);
});
//GET player stats API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStats = `
        SELECT 
            player_id AS playerId,
            player_name AS playerName,
            SUM(score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes
        FROM 
            player_details NATURAL JOIN player_match_score
        WHERE 
            player_id = ${playerId}

    `;
  const result = await db.get(getPlayerStats);
  response.send(result);
});
module.exports = app;
