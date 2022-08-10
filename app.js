const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require('axios');

// require database connection
const dbConnect = require("./db/dbConnect");
const User = require("./db/userModel");
const Company = require("./db/companyModel");
const ClimatiqFactors = require("./db/climatiqFactorModel");
const GSTravelEmission = require("./db/gsTravelEmissionModel");
const GSCargoEmission = require("./db/gsCargoEmissionModel");
const GSElectricityEmission = require("./db/gsElectricityEmissionModel");
const GSFuelEmission = require("./db/gsFuelEmissionModel");
const GoogleSheets = require("./db/googleSheetsModel");
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
        companyId: request.body.companyId,
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

// register endpoint
app.post("/registerCompany", (request, response) => {
  const company = new Company({
    name: "Kalyani",
    companyId: "2"
  });

  // save the new company
  company
    .save()
    // return success if the new company is added to the database successfully
    .then((result) => {
      response.status(201).send({
        message: "Company Created Successfully",
        companyId: result.companyId,
      });
    })
    // catch erroe if the new company wasn't added successfully to the database
    .catch((error) => {
      response.status(500).send({
        message: "Error creating company",
        error,
      });
    });
});

// register endpoint
app.get("/getLogo", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => { 
    await Company.findOne({ companyId: user.companyId }).then(async (company) => { 
      response.status(200).send({
        name: company.name,
        logo: company.logo,
      });
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
app.get("/auth-endpoint", auth, async (request, response) => {
  console.log(request.user);
  User.findOne({ _id: request.user.userId }).then((user) => {
    console.log(user.companyId);
  });
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
app.get("/fuelFactors", (request, response) => {

  ClimatiqFactors.findOne({ type: request.body.type, category: "Fuel" })

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

// getFactors endpoint
app.get("/allFuelFactors", (request, response) => {

  ClimatiqFactors.find({ category: "Fuel" })
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

app.get("/travelEmissions", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    console.log(companyId);
    await GSTravelEmission.deleteMany({ companyId: companyId });
    await GoogleSheets.findOne({ companyId: companyId }).then(async (result) => {
      const sheetsId = result.sheetsId;
      await travelEmissionfromSheets("Travel!B5:E", "Road", sheetsId, companyId);
      await travelEmissionfromSheets("Travel!G5:J", "Air", sheetsId, companyId);
    }).catch((e) => { });
    await new Promise(r => setTimeout(r, 500));
    var travelEmissions = [];
    await GSTravelEmission.find({ companyId: companyId })
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
});

app.get("/cargoEmissions", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    await GSCargoEmission.deleteMany({ companyId: companyId });
    await GoogleSheets.findOne({ companyId: companyId }).then(async (result) => {
      const sheetsId = result.sheetsId;
      await cargoEmissionfromSheets("Cargo!B5:E", "Road", sheetsId, companyId);
      await cargoEmissionfromSheets("Cargo!G5:J", "Air", sheetsId, companyId);
    }).catch((e) => { });
    await new Promise(r => setTimeout(r, 500));
    var cargoEmissions = [];
    await GSCargoEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const cargoEmission = GSCargoEmission(emission);
          cargoEmissions.push(cargoEmission);
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


});

app.get("/electricityEmissions", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    await GSElectricityEmission.deleteMany({ companyId: companyId });
    await GoogleSheets.findOne({ companyId: companyId }).then(async (result) => {
      const sheetsId = result.sheetsId;
      await electricityEmissionfromSheets("Fuel!B5:D", "All", sheetsId, companyId);
    }).catch((e) => { });
    await new Promise(r => setTimeout(r, 500));
    var electricityEmissions = [];
    await GSElectricityEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {

        emissions.forEach((emission) => {
          const electricityEmission = GSElectricityEmission(emission);
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
});

app.get("/fuelEmissions", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    await GSFuelEmission.deleteMany({ companyId: companyId });
    await GoogleSheets.findOne({ companyId: companyId }).then(async (result) => {
      const sheetsId = result.sheetsId;
      await fuelEmissionfromSheets("Fuel!B5:D", "All", sheetsId, companyId);
    }).catch((e) => { });
    await new Promise(r => setTimeout(r, 500));
    var fuelEmissions = [];
    await GSFuelEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {

        emissions.forEach((emission) => {
          const fuelEmission = GSFuelEmission(emission);
          fuelEmissions.push(fuelEmission);
        });

      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });
    response.status(200).send(fuelEmissions);
  });
});

app.get("/visualisation", auth, async (request, response) => {

  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const travelResult = { "Road": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Air": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Sea": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Rail": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 } };
    const cargoResult = { "Road": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Air": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Sea": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, "Rail": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 } };
    const electricityResult = { "Electricity": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, };
    const fuelResult = { "Fuel": { "January": 0, "February": 0, "March": 0, "April": 0, "May": 0, "June": 0, "July": 0, "August": 0, "September": 0, "October": 0, "November": 0, "December": 0 }, };
    const final = { "total": 0, "scope1": 0, "scope2": 0, "scope3": 0, "totalTravelScope": 0, "totalCargoScope": 0, "totalElectricityScope": 0, "totalFuelScope": 0, "totalElectricityUsage": 0, "totalDistanceTravelled": 0, "totalFuelExpenditure": 0 };
    var total = 0;
    var totalTravel = 0;
    var totalCargo = 0;
    var totalElectricity = 0;
    var totalFuel = 0;
    var totalElectricityUsage = 0;
    var totalDistanceTravelled = 0;
    var totalFuelExpenditure = 0;

    await GSTravelEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          travelResult[emission.travelBy][months[date.getMonth()]] += parseFloat(emission.calculation.co2e);
          total += parseFloat(emission.calculation.co2e);
          totalTravel += parseFloat(emission.calculation.co2e);
          totalDistanceTravelled += parseInt(emission.distance);
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

    await GSCargoEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {

        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          cargoResult[emission.travelBy][months[date.getMonth()]] += parseFloat(emission.calculation.co2e);
          total += parseFloat(emission.calculation.co2e);
          totalCargo += parseFloat(emission.calculation.co2e);
          totalDistanceTravelled += parseInt(emission.distance);
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
    final["totalDistanceTravelled"] = totalDistanceTravelled;

    await GSElectricityEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {

        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          electricityResult["Electricity"][months[date.getMonth()]] += parseFloat(emission.calculation.co2e);
          total += parseFloat(emission.calculation.co2e);
          totalElectricity += parseFloat(emission.calculation.co2e);
          totalElectricityUsage += parseInt(emission.energy);
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
    final["totalElectricityUsage"] = totalElectricityUsage;

    await GSFuelEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {

        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          fuelResult["Fuel"][months[date.getMonth()]] += parseFloat(emission.calculation.co2e);
          total += parseFloat(emission.calculation.co2e);
          totalFuel += parseFloat(emission.calculation.co2e);
          totalFuelExpenditure += parseInt(emission.money);
        });

      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    final["totalFuelScope"] = totalFuel;
    final["totalFuelExpenditure"] = totalFuelExpenditure;

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

    final["Fuel"] = {};
    Object.keys(fuelResult).forEach((key) => {
      final["Fuel"][key] = [];
      Object.keys(fuelResult[key]).forEach((month) => {
        final["Fuel"][key].push({ "month": month, "emission": fuelResult[key][month] });
      });
    });
    response.status(200).send(final);
  });
});

app.post("/googleSheets", auth, async (request, response) => {
  var sheetURL = request.body.sheetURL;
  let sheetsId = sheetURL.slice(39, 83);
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    GoogleSheets.findOne({ companyId: user.companyId }).then(async (sheets) => {
      sheets.sheetsId = sheetsId;
      await sheets.save();
    }).catch(async (e) => {
      const sheets = GoogleSheets({
        companyId: user.companyId,
        sheetsId: sheetsId
      });
      await sheets.save();
    });
  });

  response.status(200).send({ "Message": "Sheet Updated" });
});

async function travelEmissionfromSheets(range, type, id, companyId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credential.json',
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  // Create client instance for auth
  const client = await auth.getClient();

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = id;

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
          var emissionDate = Date.parse(value[0]);
          const travelEmission = new GSTravelEmission({
            date: new Date(emissionDate),
            passengers: parseInt(value[1]),
            factorType: 1,
            travelBy: type,
            distance: parseInt(value[2]),
            companyId: companyId,
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

async function cargoEmissionfromSheets(range, type, id, companyId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credential.json',
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  // Create client instance for auth
  const client = await auth.getClient();

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = id;

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
          var emissionDate = Date.parse(value[0]);
          const cargoEmission = new GSCargoEmission({
            date: new Date(emissionDate),
            weight: parseInt(value[1]),
            factorType: 1,
            travelBy: type,
            distance: parseInt(value[2]),
            companyId: companyId,
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

async function electricityEmissionfromSheets(range, type, id, companyId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credential.json',
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  // Create client instance for auth
  const client = await auth.getClient();

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = id;

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
          var emissionDate = Date.parse(value[0]);
          const electricityEmission = new GSElectricityEmission({
            date: new Date(emissionDate),
            energy: parseInt(value[1]),
            factorType: 1,
            companyId: companyId,
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

async function fuelEmissionfromSheets(range, type, id, companyId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credential.json',
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  // Create client instance for auth
  const client = await auth.getClient();

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = id;

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: range,
  });

  const allValues = getRows.data.values;

  if (allValues) {
    await ClimatiqFactors.find({ category: "Fuel" })
      .then(async (climatiqFactors) => {
        var factors = {};
        climatiqFactors.forEach((factor) => {
          factors[factor.type] = factor;
        })
        allValues.forEach(async (value) => {
          var emissionDate = Date.parse(value[0]);
          const fuelEmission = new GSFuelEmission({
            date: new Date(emissionDate),
            money: parseInt(value[1]),
            factorType: 1,
            companyId: companyId,
          });
          await axios({
            method: 'POST',
            url: 'https://beta3.api.climatiq.io/estimate',
            data: JSON.stringify({
              "emission_factor": {
                "activity_id": factors[type]["factors"][fuelEmission.factorType]["factor"],
              },
              "parameters": {
                "money": fuelEmission.money,
                "money_unit": "inr"
              }
            }),
            headers: {
              Authorization: 'Bearer ' + 'TABXE4QS5FMMCENSPQJXWRYJ13XD'
            }
          }).then(async function (res) {
            fuelEmission.calculation = res.data;
            await fuelEmission.save()
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