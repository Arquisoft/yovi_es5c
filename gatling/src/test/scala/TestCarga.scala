package myapp

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class SimpleFlowSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl("http://localhost:8000")
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")

  val csvFeeder = csv("users.csv").random()

  val scn = scenario("Registro + Login + Partida + Logout")


    // Previo: Registro
    .feed(csvFeeder)
    .exec(
      http("POST /user - Registro")
        .post("/user")
        .body(StringBody("""{ "username": "${username}", "password": "${password}", "name": "${name}", "surname": "${surname}", "email": "${email}" }"""))
        .check(status.in(200, 201))
    )
    .pause(1, 2)

    // 1. Login
    .feed(csvFeeder)
    .exec(
      http("POST /login")
        .post("/login")
        .body(StringBody("""{ "username": "${username}", "password": "${password}" }"""))
        .check(status.is(200))
        .check(jsonPath("$.token").saveAs("authToken"))
    )
    .pause(1, 2)

    // 2. Jugar una partida
    .exec(
      http("POST /play")
        .post("/play")
        .header("Authorization", "Bearer ${authToken}")
        .body(StringBody("""{
          "position": 4,
          "bot_id": "center_bot",
          "difficulty": "Easy"
        }"""))
        .check(status.is(200))
    )
    .pause(1, 2)

    // 3. Logout
    .exec(
      http("POST /logout")
        .post("/logout")
        .body(StringBody("""{ "username": "${username}" }"""))
        .check(status.is(200))
    )

  setUp(
    scn.inject(constantUsersPerSec(2).during(60.seconds).randomized)
  ).protocols(httpProtocol)

  .assertions(
    global.responseTime.max.lt(2000),
    global.successfulRequests.percent.gt(95)
  )
}