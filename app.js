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
const GSTravelEmission = require("./db/gsTravelEmissionModel");
const CargoEmission = require("./db/cargoEmissionModel");
const GSCargoEmission = require("./db/gsCargoEmissionModel");
const ElectricityEmission = require("./db/electricityEmissionModel");
const GSElectricityEmission = require("./db/gsElectricityEmissionModel");
const auth = require("./auth");
const { google } = require('googleapis');
var admin = require('firebase-admin');

const serviceAccount = require("./keys/lowsoot-3d8ff-firebase-adminsdk-xtk5p-f90790ef2a.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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

app.post("/travelEmission", async (request, response) => {
  ClimatiqFactors.find({ category: "Travel" })
    .then(async (climatiqFactors) => {
      var factors = {};
      climatiqFactors.forEach((factor) => {
        factors[factor.type] = factor;
      })
      const travelEmission = new TravelEmission(request.body);
      travelEmission.fromSheets = false;
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

app.get("/travelEmissions", async (request, response) => {
  await GSTravelEmission.deleteMany({});
  await travelEmissionfromSheets("Travel!B5:E", "Road");
  await travelEmissionfromSheets("Travel!G5:J", "Air");
  await new Promise(r => setTimeout(r, 500));
  var travelEmissions = [];
  await TravelEmission.find()
    // if travel emissions exists
    .then((emissions) => {

      emissions.forEach((emission) => {
        const travelEmission = TravelEmission(emission);
        travelEmissions.push(travelEmission);
      });

    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });
  await GSTravelEmission.find()
    // if travel emissions exists
    .then((emissions) => {

      emissions.forEach((emission) => {
        const travelEmission = GSTravelEmission(emission);
        travelEmissions.push(travelEmission);
      });

    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });
  response.status(200).send(travelEmissions);
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

app.get("/cargoEmissions", async (request, response) => {
  await GSCargoEmission.deleteMany({});
  await cargoEmissionfromSheets("Cargo!B5:E", "Road");
  await cargoEmissionfromSheets("Cargo!G5:J", "Air");
  await new Promise(r => setTimeout(r, 500));
  var cargoEmissions = [];
  await CargoEmission.find()
    // if travel emissions exists
    .then((emissions) => {
      emissions.forEach((emission) => {
        const travelEmission = CargoEmission(emission);
        cargoEmissions.push(travelEmission);
      });

    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });
  await GSCargoEmission.find()
    // if travel emissions exists
    .then((emissions) => {
      emissions.forEach((emission) => {
        const travelEmission = CargoEmission(emission);
        cargoEmissions.push(travelEmission);
      });

    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });
  response.status(200).send(cargoEmissions);
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
      }).then(async function (response) {
        electricityEmission.calculation = response.data;
        await ElectricityEmission.updateOne({ _id: electricityEmission._id }, electricityEmission);
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
    message: "Electricity Emission updated successfully"
  });
});

app.delete("/electricityEmission", async (request, response) => {
  await ElectricityEmission.deleteOne({ _id: request.body._id });
  response.status(200).send({
    message: "Electricity Emission deleted successfully"
  });
});

app.get("/electricityEmissions", async (request, response) => {
  await GSElectricityEmission.deleteMany({});
  await electricityEmissionfromSheets("Electricity!B5:D", "All");
  await new Promise(r => setTimeout(r, 500));
  var electricityEmissions = [];
  await ElectricityEmission.find()
    // if travel emissions exists
    .then((emissions) => {

      emissions.forEach((emission) => {
        const electricityEmission = ElectricityEmission(emission);
        electricityEmissions.push(electricityEmission);
      });

    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });

  await GSElectricityEmission.find()
    // if travel emissions exists
    .then((emissions) => {

      emissions.forEach((emission) => {
        const electricityEmission = ElectricityEmission(emission);
        electricityEmissions.push(electricityEmission);
      });

    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });
  response.status(200).send(electricityEmissions);
});

app.get("/visualisation", async (request, response) => {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const travelResult = { "Road": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Air": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Sea": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Rail": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 } };
  const cargoResult = { "Road": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Air": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Sea": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Rail": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 } };
  const electricityResult = { "Electricity": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, };
  const final = { "total": 0, "scope1": 0, "scope2": 0, "scope3": 0, "totalTravelScope": 0, "totalCargoScope": 0, "totalElectricityScope": 0, };
  var total = 0;
  var totalTravel = 0;
  var totalCargo = 0;
  var totalElectricity = 0;

  await TravelEmission.find()
    // if travel emissions exists
    .then((emissions) => {
      emissions.forEach((emission) => {
        const date = new Date(emission.date);
        travelResult[emission.travelBy][months[date.getMonth()]] += parseFloat(emission.calculation.co2e);
        total += parseFloat(emission.calculation.co2e);
        totalTravel += parseFloat(emission.calculation.co2e);
      });
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });

  await GSTravelEmission.find()
    // if travel emissions exists
    .then((emissions) => {
      emissions.forEach((emission) => {
        const date = new Date(emission.date);
        travelResult[emission.travelBy][months[date.getMonth()]] += parseFloat(emission.calculation.co2e);
        total += parseFloat(emission.calculation.co2e);
        totalTravel += parseFloat(emission.calculation.co2e);
      });
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });

  final["totalTravelScope"] = totalTravel;

  await CargoEmission.find()
    // if travel emissions exists
    .then((emissions) => {

      emissions.forEach((emission) => {
        const date = new Date(emission.date);
        cargoResult[emission.travelBy][months[date.getMonth()]] += parseFloat(emission.calculation.co2e);
        total += parseFloat(emission.calculation.co2e);
        totalCargo += parseFloat(emission.calculation.co2e);
      });

    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });

  await GSCargoEmission.find()
    // if travel emissions exists
    .then((emissions) => {

      emissions.forEach((emission) => {
        const date = new Date(emission.date);
        cargoResult[emission.travelBy][months[date.getMonth()]] += parseFloat(emission.calculation.co2e);
        total += parseFloat(emission.calculation.co2e);
        totalCargo += parseFloat(emission.calculation.co2e);
      });

    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });

  final["totalCargoScope"] = totalCargo;

  await ElectricityEmission.find()
    // if travel emissions exists
    .then((emissions) => {

      emissions.forEach((emission) => {
        const date = new Date(emission.date);
        electricityResult["Electricity"][months[date.getMonth()]] += parseFloat(emission.calculation.co2e);
        total += parseFloat(emission.calculation.co2e);
        totalElectricity += parseFloat(emission.calculation.co2e);
      });

    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });

  await GSElectricityEmission.find()
    // if travel emissions exists
    .then((emissions) => {

      emissions.forEach((emission) => {
        const date = new Date(emission.date);
        electricityResult["Electricity"][months[date.getMonth()]] += parseFloat(emission.calculation.co2e);
        total += parseFloat(emission.calculation.co2e);
        totalElectricity += parseFloat(emission.calculation.co2e);
      });

    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Data not found",
        e,
      });
    });

  final["totalElectricityScope"] = totalElectricity;

  final["total"] = total;
  final["scope2"] = final["totalElectricityScope"];
  final["scope3"] = final["totalTravelScope"] + final["totalCargoScope"];

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

  final["Electricity"] = {};
  Object.keys(electricityResult).forEach((key) => {
    final["Electricity"][key] = [];
    Object.keys(electricityResult[key]).forEach((month) => {
      final["Electricity"][key].push({ "month": month, "emission": electricityResult[key][month] });
    });
  });
  response.status(200).send(final);
});

async function travelEmissionfromSheets(range, type) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credential.json',
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  // Create client instance for auth
  const client = await auth.getClient();

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = "1iKDcpEX2v4BwxtisSFBPFoE1rg-Rr2D7j36n2DxuMcQ";

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: range,
  });

  const allValues = getRows.data.values;

  var travelEmissions = [];
  if (allValues) {
    await ClimatiqFactors.find({ category: "Travel" })
      .then(async (climatiqFactors) => {
        var factors = {};
        climatiqFactors.forEach((factor) => {
          factors[factor.type] = factor;
        })
        allValues.forEach(async (value) => {
          const travelEmission = new GSTravelEmission({
            date: Date(value[0]),
            passengers: parseInt(value[1]),
            factorType: 1,
            travelBy: type,
            distance: parseInt(value[2])
          });
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
            await travelEmission.save().then((addedEmission) => {
              travelEmissions.push(addedEmission);
            });
          }).catch(function (error) {
            console.log(error);
          });
        });
      }).catch((e) => {
        console.log(e);
      });
  }
}

async function cargoEmissionfromSheets(range, type) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credential.json',
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  // Create client instance for auth
  const client = await auth.getClient();

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = "1iKDcpEX2v4BwxtisSFBPFoE1rg-Rr2D7j36n2DxuMcQ";

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: range,
  });

  const allValues = getRows.data.values;

  if (allValues) {
    await ClimatiqFactors.find({ category: "Cargo" })
      .then(async (climatiqFactors) => {
        var factors = {};
        climatiqFactors.forEach((factor) => {
          factors[factor.type] = factor;
        })
        allValues.forEach(async (value) => {
          const cargoEmission = new GSCargoEmission({
            date: Date(value[0]),
            weight: parseInt(value[1]),
            factorType: 1,
            travelBy: type,
            distance: parseInt(value[2])
          });
          await axios({
            method: 'POST',
            url: 'https://beta3.api.climatiq.io/estimate',
            data: JSON.stringify({
              "emission_factor": factors[cargoEmission.travelBy]["factors"][cargoEmission.factorType]["factor"],
              "parameters": {
                "distance": cargoEmission.distance,
                "distance_unit": "km",
                "weight": cargoEmission.weight
              }
            }),
            headers: {
              Authorization: 'Bearer ' + 'TABXE4QS5FMMCENSPQJXWRYJ13XD'
            }
          }).then(async function (res) {
            cargoEmission.calculation = res.data;
            await cargoEmission.save()
          }).catch(function (error) {
            console.log(error);
          });
        });
      }).catch((e) => {
        console.log(e);
      });
  }
}

async function electricityEmissionfromSheets(range, type) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credential.json',
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  // Create client instance for auth
  const client = await auth.getClient();

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = "1iKDcpEX2v4BwxtisSFBPFoE1rg-Rr2D7j36n2DxuMcQ";

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: range,
  });

  const allValues = getRows.data.values;

  if (allValues) {
    await ClimatiqFactors.find({ category: "Electricity" })
      .then(async (climatiqFactors) => {
        var factors = {};
        climatiqFactors.forEach((factor) => {
          factors[factor.type] = factor;
        })
        allValues.forEach(async (value) => {
          const electricityEmission = new GSElectricityEmission({
            date: Date(value[0]),
            energy: parseInt(value[1]),
            factorType: 1,
          });
          await axios({
            method: 'POST',
            url: 'https://beta3.api.climatiq.io/estimate',
            data: JSON.stringify({
              "emission_factor": {
                "activity_id": factors[type]["factors"][electricityEmission.factorType]["factor"],
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
            await electricityEmission.save()
          }).catch(function (error) {
            console.log(error);
          });
        });
      }).catch((e) => {
        console.log(e);
      });
  }
}

module.exports = app;