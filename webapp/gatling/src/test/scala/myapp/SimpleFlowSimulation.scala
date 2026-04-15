package myapp

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class SimpleFlowSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl("http://4.233.210.164:8000") // CORREGIDO: de /8000 a :8000
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")

  val csvFeeder = csv("data/users.csv").random()

  val scn = scenario("Login + Iniciar Partida + Historial + Logout")
    .feed(csvFeeder)
    // 1. Login
    .exec(
      http("POST /login")
        .post("/login")
        .body(StringBody("""{ "username": "${username}", "password": "${password}" }"""))
        .check(status.is(200))
        .check(jsonPath("$.token").saveAs("authToken"))
    )
    .pause(2, 4)
    // 2. Iniciar una partida
    .exec(
      http("POST /play")
        .post("/play")
        .header("Authorization", "Bearer ${authToken}")
        .body(StringBody("""{
          "position": 4,
          "bot_id": "center_bot",
          "difficulty": "Medium"
        }"""))
        .check(status.is(200))
    )
    .pause(2, 4)
    // 3. Consultar el historial de partidas
    .exec(
      http("GET /history")
        .get("/user/${username}/history")
        .header("Authorization", "Bearer ${authToken}")
        .check(status.is(200))
    )
    .pause(2, 4)
    // 4. Logout
    .exec(
      http("POST /logout")
        .post("/logout")
        .body(StringBody("""{ "username": "${username}" }"""))
        .check(status.is(200))
    )

  setUp(
    scn.inject(
      atOnceUsers(1),
      rampUsers(15).during(30.seconds)
    )
  ).protocols(httpProtocol)
  .assertions(
    global.responseTime.max.lt(2000),
    global.successfulRequests.percent.gt(60)
  )
}