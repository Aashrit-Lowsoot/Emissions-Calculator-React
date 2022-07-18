const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require('axios');

// require database connection
const dbConnect = require("./db/dbConnect");
const User = require("./db/userModel");
const ClimatiqFactors = require("./db/climatiqFactorModel");
const TravelEmission = require("./db/travelEmissionModel");
const CargoEmission = require("./db/cargoEmissionModel");
const ElectricityEmission = require("./db/electricityEmissionModel");
const auth = require("./auth");

// execute database connection
dbConnect();

// Curb Cores Error by adding a header here
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (request, response, next) => {
  response.json({ message: "Hey! This is your server response!" });
  next();
});

// register endpoint
app.post("/register", (request, response) => {
  // hash the password
  bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {
      // create a new user instance and collect the data
      const user = new User({
        email: request.body.email,
        password: hashedPassword,
      });

      // save the new user
      user
        .save()
        // return success if the new user is added to the database successfully
        .then((result) => {
          response.status(201).send({
            message: "User Created Successfully",
            result,
          });
        })
        // catch erroe if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: "Error creating user",
            error,
          });
        });
    })
    // catch error if the password hash isn't successful
    .catch((e) => {
      response.status(500).send({
        message: "Password was not hashed successfully",
        e,
      });
    });
});

// login endpoint
app.post("/login", (request, response) => {
  // check if email exists
  User.findOne({ email: request.body.email })

    // if email exists
    .then((user) => {
      // compare the password entered and the hashed password found
      bcrypt
        .compare(request.body.password, user.password)

        // if the passwords match
        .then((passwordCheck) => {

          // check if password matches
          if (!passwordCheck) {
            return response.status(400).send({
              message: "Passwords does not match",
              error,
            });
          }

          //   create JWT token
          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
          );

          //   return success response
          response.status(200).send({
            message: "Login Successful",
            email: user.email,
            token,
          });
        })
        // catch error if password do not match
        .catch((error) => {
          response.status(400).send({
            message: "Passwords does not match",
            error,
          });
        });
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});

// free endpoint
app.get("/free-endpoint", (request, response) => {
  response.json({ message: "You are free to access me anytime" });
});

// authentication endpoint
app.get("/auth-endpoint", auth, (request, response) => {
  response.send({ message: "You are authorized to access me" });
});

// getFactors endpoint
app.get("/travelFactors", (request, response) => {

  ClimatiqFactors.findOne({ type: request.body.type, category: "Travel" })

    // if email exists
    .then((climatiq) => {
      // compare the password entered and the hashed password found
      var factors = {};
      const keys = Object.keys(climatiq.factors);
      keys.forEach((key) => {
        if (request.body.getName) {
          factors[key] = climatiq.factors[key].name;
        } else {
          factors[key] = climatiq.factors[key].factor;
        }
      });
      //   return success response
      response.status(200).send(factors);
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });
});

// getFactors endpoint
app.get("/cargoFactors", (request, response) => {

  ClimatiqFactors.findOne({ type: request.body.type, category: "Cargo" })

    // if email exists
    .then((climatiq) => {
      // compare the password entered and the hashed password found
      var factors = {};
      const keys = Object.keys(climatiq.factors);
      keys.forEach((key) => {
        if (request.body.getName) {
          factors[key] = climatiq.factors[key].name;
        } else {
          factors[key] = climatiq.factors[key].factor;
        }
      });
      //   return success response
      response.status(200).send(factors);
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });
});

// getFactors endpoint
app.get("/electricityFactors", (request, response) => {

  ClimatiqFactors.findOne({ type: request.body.type, category: "Electricity" })

    // if email exists
    .then((climatiq) => {
      // compare the password entered and the hashed password found
      var factors = {};
      const keys = Object.keys(climatiq.factors);
      keys.forEach((key) => {
        if (request.body.getName) {
          factors[key] = climatiq.factors[key].name;
        } else {
          factors[key] = climatiq.factors[key].factor;
        }
      });
      //   return success response
      response.status(200).send(factors);
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });
});

// getFactors endpoint
app.get("/allTravelFactors", (request, response) => {

  ClimatiqFactors.find({ category: "Travel" })
    // if travel emissions exists
    .then((factors) => {
      var allFactors = {};
      factors.forEach((climatiq) => {
        var factors = [];
        const keys = Object.keys(climatiq.factors);
        keys.forEach((key) => {
          factors.push({ "id": key, "factor": climatiq.factors[key].name });
        });
        allFactors[climatiq.type] = factors;
      });
      response.status(200).send(allFactors);
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });

});

// getFactors endpoint
app.get("/allCargoFactors", (request, response) => {

  ClimatiqFactors.find({ category: "Cargo" })
    // if travel emissions exists
    .then((factors) => {
      var allFactors = {};
      factors.forEach((climatiq) => {
        var factors = [];
        const keys = Object.keys(climatiq.factors);
        keys.forEach((key) => {
          factors.push({ "id": key, "factor": climatiq.factors[key].name });
        });
        allFactors[climatiq.type] = factors;
      });
      response.status(200).send(allFactors);
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });

});

// getFactors endpoint
app.get("/allElectricityFactors", (request, response) => {

  ClimatiqFactors.find({ category: "Electricity" })
    // if travel emissions exists
    .then((factors) => {
      var allFactors = {};
      factors.forEach((climatiq) => {
        var factors = [];
        const keys = Object.keys(climatiq.factors);
        keys.forEach((key) => {
          factors.push({ "id": key, "factor": climatiq.factors[key].name });
        });
        allFactors[climatiq.type] = factors;
      });
      response.status(200).send(allFactors);
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });

});

app.post("/travelEmission", (request, response) => {
  ClimatiqFactors.find({ category: "Travel" })
    .then(async (climatiqFactors) => {
      var factors = {};
      climatiqFactors.forEach((factor) => {
        factors[factor.type] = factor;
      })
      const travelEmission = new TravelEmission(request.body);
      await axios({
        method: 'POST',
        url: 'https://beta3.api.climatiq.io/estimate',
        data: JSON.stringify({
          "emission_factor": factors[travelEmission.travelBy]["factors"][travelEmission.factorType]["factor"],
          "parameters": {
            "distance": travelEmission.distance,
            "distance_unit": "km",
            "passengers": travelEmission.passengers
          }
        }),
        headers: {
          Authorization: 'Bearer ' + 'TABXE4QS5FMMCENSPQJXWRYJ13XD'
        }
      }).then(async function (res) {
        travelEmission.calculation = res.data;
        // save the new travel emission
        var id = "";
        await travelEmission.save().then((addedEmission) => {
          id = addedEmission._id;
        });
        response.status(201).send({
          message: "Travel Emission added successfully",
          _id: id
        });
      }).catch(function (error) {
        console.log(error);
      });
    }).catch((e) => {
      response.status(404).send({
        message: "Factors not found",
        e,
      });
    });
});

app.put("/travelEmission", (request, response) => {
  ClimatiqFactors.find({ category: "Travel" })
    .then(async (climatiqFactors) => {
      var factors = {};
      climatiqFactors.forEach((factor) => {
        factors[factor.type] = factor;
      })
      const travelEmission = new TravelEmission(request.body);
      await axios({
        method: 'POST',
        url: 'https://beta3.api.climatiq.io/estimate',
        data: JSON.stringify({
          "emission_factor": factors[travelEmission.travelBy]["factors"][travelEmission.factorType]["factor"],
          "parameters": {
            "distance": travelEmission.distance,
            "distance_unit": "km",
            "passengers": travelEmission.passengers
          }
        }),
        headers: {
          Authorization: 'Bearer ' + 'TABXE4QS5FMMCENSPQJXWRYJ13XD'
        }
      }).then(async function (response) {
        travelEmission.calculation = response.data;
        await TravelEmission.updateOne({ _id: travelEmission._id }, travelEmission);
      }).catch(function (error) {
        console.log(error);
      });
    }).catch((e) => {
      response.status(404).send({
        message: "Factors not found",
        e,
      });
    });
  response.status(200).send({
    message: "Travel Emission updated successfully"
  });
});

app.delete("/travelEmission", async (request, response) => {
  await TravelEmission.deleteOne({ _id: request.body._id });
  response.status(200).send({
    message: "Travel Emission deleted successfully"
  });
});

app.get("/travelEmissions", (request, response) => {
  TravelEmission.find()
    // if travel emissions exists
    .then((emissions) => {
      var travelEmissions = [];
      emissions.forEach((emission) => {
        const travelEmission = TravelEmission(emission);
        travelEmissions.push(travelEmission);
      });
      response.status(200).send(travelEmissions);
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });
});

app.post("/cargoEmission", (request, response) => {
  ClimatiqFactors.find({ category: "Cargo" })
    .then(async (climatiqFactors) => {
      var factors = {};
      climatiqFactors.forEach((factor) => {
        factors[factor.type] = factor;
      })
      const cargoEmission = new CargoEmission(request.body);
      await axios({
        method: 'POST',
        url: 'https://beta3.api.climatiq.io/estimate',
        data: JSON.stringify({
          "emission_factor": factors[cargoEmission.travelBy]["factors"][cargoEmission.factorType]["factor"],
          "parameters": {
            "distance": cargoEmission.distance,
            "distance_unit": "km",
            "weight": cargoEmission.weight,
            "weight_unit": "kg"
          }
        }),
        headers: {
          Authorization: 'Bearer ' + 'TABXE4QS5FMMCENSPQJXWRYJ13XD'
        }
      }).then(async function (res) {
        cargoEmission.calculation = res.data;
        // save the new emission
        var id = "";
        await cargoEmission.save().then((addedEmission) => {
          id = addedEmission._id;
        });
        response.status(201).send({
          message: "Cargo Emission added successfully",
          _id: id
        });
      }).catch(function (error) {
        console.log(error);
      });
    }).catch((e) => {
      response.status(404).send({
        message: "Factors not found",
        e: e.message,
      });
    });
});

app.put("/cargoEmission", (request, response) => {
  ClimatiqFactors.find({ category: "Cargo" })
    .then(async (climatiqFactors) => {
      var factors = {};
      climatiqFactors.forEach((factor) => {
        factors[factor.type] = factor;
      })
      const cargoEmission = new CargoEmission(request.body);
      await axios({
        method: 'POST',
        url: 'https://beta3.api.climatiq.io/estimate',
        data: JSON.stringify({
          "emission_factor": factors[cargoEmission.travelBy]["factors"][cargoEmission.factorType]["factor"],
          "parameters": {
            "distance": cargoEmission.distance,
            "distance_unit": "km",
            "weight": cargoEmission.weight,
            "weight_unit": "kg"
          }
        }),
        headers: {
          Authorization: 'Bearer ' + 'TABXE4QS5FMMCENSPQJXWRYJ13XD'
        }
      }).then(async function (response) {
        cargoEmission.calculation = response.data;
        await CargoEmission.updateOne({ _id: cargoEmission._id }, cargoEmission);
      }).catch(function (error) {
        console.log(error);
      });
    }).catch((e) => {
      response.status(404).send({
        message: "Factors not found",
        e,
      });
    });
  response.status(200).send({
    message: "Cargo Emission updated successfully"
  });
});

app.delete("/cargoEmission", async (request, response) => {
  await CargoEmission.deleteOne({ _id: request.body._id });
  response.status(200).send({
    message: "Cargo Emission deleted successfully"
  });
});

app.get("/cargoEmissions", (request, response) => {
  CargoEmission.find()
    // if travel emissions exists
    .then((emissions) => {
      var cargoEmissions = [];
      emissions.forEach((emission) => {
        const travelEmission = CargoEmission(emission);
        cargoEmissions.push(travelEmission);
      });
      response.status(200).send(cargoEmissions);
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });
});

app.post("/electricityEmission", (request, response) => {
  ClimatiqFactors.find({ category: "Electricity" })
    .then(async (climatiqFactors) => {
      var factors = {};
      climatiqFactors.forEach((factor) => {
        factors[factor.type] = factor;
      })
      const electricityEmission = new ElectricityEmission(request.body);
      await axios({
        method: 'POST',
        url: 'https://beta3.api.climatiq.io/estimate',
        data: JSON.stringify({
          "emission_factor": {
            "activity_id": factors["All"]["factors"][electricityEmission.factorType]["factor"],
          },
          "parameters": {
            "energy": electricityEmission.energy,
          }
        }),
        headers: {
          Authorization: 'Bearer ' + 'TABXE4QS5FMMCENSPQJXWRYJ13XD'
        }
      }).then(async function (res) {
        electricityEmission.calculation = res.data;
        // save the new emission
        var id = "";
        await electricityEmission.save().then((addedEmission) => {
          id = addedEmission._id;
        });
        response.status(201).send({
          message: "Electricity Emission added successfully",
          _id: id
        });
      }).catch(function (error) {
        console.log(error);
      });
    }).catch((e) => {
      response.status(404).send({
        message: "Factors not found",
        e: e.message,
      });
    });
});

app.put("/electricityEmission", (request, response) => {
  ClimatiqFactors.find({ category: "Cargo" })
    .then(async (climatiqFactors) => {
      var factors = {};
      climatiqFactors.forEach((factor) => {
        factors[factor.type] = factor;
      })
      const electricityEmission = new CargoEmission(request.body);
      await axios({
        method: 'POST',
        url: 'https://beta3.api.climatiq.io/estimate',
        data: JSON.stringify({
          "emission_factor": factors[electricityEmission.travelBy]["factors"][electricityEmission.factorType]["factor"],
          "parameters": {
            "distance": electricityEmission.distance,
            "distance_unit": "km",
            "weight": electricityEmission.weight,
            "weight_unit": "kg"
          }
        }),
        headers: {
          Authorization: 'Bearer ' + 'TABXE4QS5FMMCENSPQJXWRYJ13XD'
        }
      }).then(async function (response) {
        electricityEmission.calculation = response.data;
        await CargoEmission.updateOne({ _id: electricityEmission._id }, electricityEmission);
      }).catch(function (error) {
        console.log(error);
      });
    }).catch((e) => {
      response.status(404).send({
        message: "Factors not found",
        e,
      });
    });
  response.status(200).send({
    message: "Cargo Emission updated successfully"
  });
});

app.delete("/electricityEmission", async (request, response) => {
  await CargoEmission.deleteOne({ _id: request.body._id });
  response.status(200).send({
    message: "Cargo Emission deleted successfully"
  });
});

app.get("/electricityEmissions", (request, response) => {
  ElectricityEmission.find()
    // if travel emissions exists
    .then((emissions) => {
      var cargoEmissions = [];
      emissions.forEach((emission) => {
        const travelEmission = ElectricityEmission(emission);
        cargoEmissions.push(travelEmission);
      });
      response.status(200).send(cargoEmissions);
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });
});

app.get("/visualisation", async (request, response) => {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const travelResult = { "Road": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Air": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Sea": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Rail": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 } };
  const cargoResult = { "Road": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Air": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Sea": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Rail": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 } };
  const final = { "total": 0, "scope1": 0, "scope2": 0, "scope3": 0 };
  var total = 0;
  await TravelEmission.find()
    // if travel emissions exists
    .then((emissions) => {
      var scope3 = 0;
      emissions.forEach((emission) => {
        const date = new Date(emission.date);
        travelResult[emission.travelBy][months[date.getMonth()]] += parseFloat(emission.calculation.co2e);
        total += parseFloat(emission.calculation.co2e);
        scope3 += parseFloat(emission.calculation.co2e);
      });
      final["scope3"] = scope3;
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });

  await CargoEmission.find()
    // if travel emissions exists
    .then((emissions) => {
      var scope2 = 0;
      emissions.forEach((emission) => {
        const date = new Date(emission.date);
        cargoResult[emission.travelBy][months[date.getMonth()]] += parseFloat(emission.calculation.co2e);
        total += parseFloat(emission.calculation.co2e);
        scope2 += parseFloat(emission.calculation.co2e);
      });
      final["scope2"] = scope2;
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });

  final["total"] = total;

  final["Travel"] = {};
  Object.keys(travelResult).forEach((key) => {

    final["Travel"][key] = [];
    Object.keys(travelResult[key]).forEach((month) => {
      final["Travel"][key].push({ "month": month, "emission": travelResult[key][month] });
    });
  });

  final["Cargo"] = {};
  Object.keys(cargoResult).forEach((key) => {
    final["Cargo"][key] = [];
    Object.keys(cargoResult[key]).forEach((month) => {
      final["Cargo"][key].push({ "month": month, "emission": cargoResult[key][month] });
    });
  });
  response.status(200).send(final);
});

module.exports = app;