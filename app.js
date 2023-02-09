const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const cors = require("cors");

// require database connection
const dbConnect = require("./db/dbConnect");
const User = require("./db/userModel");
const Company = require("./db/companyModel");
const ClimatiqFactors = require("./db/climatiqFactorModel");
const TravelEmission = require("./db/travelEmissionModel");
const GSTravelEmission = require("./db/gsTravelEmissionModel");
const CargoEmission = require("./db/cargoEmissionModel");
const GSCargoEmission = require("./db/gsCargoEmissionModel");
const GSFuelEmission = require("./db/gsFuelEmissionModel");
const FuelEmission = require("./db/fuelEmissionModel");
const ElectricityEmission = require("./db/electricityEmissionModel");
const GSElectricityEmission = require("./db/gsElectricityEmissionModel");
const TaskModel = require("./db/taskModel");
const ProductEmission = require("./db/productEmissionModel");
const GSProductEmission = require("./db/gsProductEmissionModel");
const DeliveryEmission = require("./db/deliveryEmissionModel");
const GSDeliveryEmission = require("./db/gsDeliveryEmissionModel");
const BuildingEmission = require("./db/buildingEmissionModel");
const GSBuildingEmission = require("./db/gsBuildingEmissionModel");
const GoogleSheets = require("./db/googleSheetsModel");
const auth = require("./auth");
const { google } = require("googleapis");
var admin = require("firebase-admin");

const serviceAccount = require("./keys/lowsoot-3d8ff-firebase-adminsdk-xtk5p-f90790ef2a.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// execute database connection
dbConnect();

app.use(cors());

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
    companyId: "2",
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
    await Company.findOne({ companyId: user.companyId }).then(
      async (company) => {
        response.status(200).send({
          name: company.name,
          logo: company.logo,
        });
      }
    );
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
            companyId: user.companyId,
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
          factors.push({ id: key, factor: climatiq.factors[key].name });
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
          factors.push({ id: key, factor: climatiq.factors[key].name });
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
          factors.push({ id: key, factor: climatiq.factors[key].name });
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
          factors.push({ id: key, factor: climatiq.factors[key].name });
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

app.post("/travelEmission", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    console.log(companyId);
    ClimatiqFactors.find({ category: "Travel" })
      .then(async (climatiqFactors) => {
        var factors = {};
        climatiqFactors.forEach((factor) => {
          factors[factor.type] = factor;
        });
        const travelEmission = new TravelEmission(request.body);
        travelEmission.fromSheets = false;
        travelEmission.companyId = companyId;
        await axios({
          method: "POST",
          url: "https://beta3.api.climatiq.io/estimate",
          data: JSON.stringify({
            emission_factor:
              factors[travelEmission.travelBy]["factors"][
                travelEmission.factorType
              ]["factor"],
            parameters: {
              distance: travelEmission.distance,
              distance_unit: "km",
              passengers: travelEmission.passengers,
            },
          }),
          headers: {
            Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
          },
        })
          .then(async function (res) {
            travelEmission.calculation = res.data;
            // save the new travel emission
            var id = "";
            await travelEmission.save().then((addedEmission) => {
              id = addedEmission._id;
            });
            response.status(201).send({
              message: "Travel Emission added successfully",
              _id: id,
            });
          })
          .catch(function (error) {
            console.log(error);
          });
      })
      .catch((e) => {
        response.status(404).send({
          message: "Factors not found",
          e,
        });
      });
  });
});

app.put("/travelEmission", auth, (request, response) => {
  ClimatiqFactors.find({ category: "Travel" })
    .then(async (climatiqFactors) => {
      var factors = {};
      climatiqFactors.forEach((factor) => {
        factors[factor.type] = factor;
      });
      const travelEmission = new TravelEmission(request.body);
      await axios({
        method: "POST",
        url: "https://beta3.api.climatiq.io/estimate",
        data: JSON.stringify({
          emission_factor:
            factors[travelEmission.travelBy]["factors"][
              travelEmission.factorType
            ]["factor"],
          parameters: {
            distance: travelEmission.distance,
            distance_unit: "km",
            passengers: travelEmission.passengers,
          },
        }),
        headers: {
          Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
        },
      })
        .then(async function (response) {
          travelEmission.calculation = response.data;
          await TravelEmission.updateOne(
            { _id: travelEmission._id },
            travelEmission
          );
        })
        .catch(function (error) {
          console.log(error);
        });
    })
    .catch((e) => {
      response.status(404).send({
        message: "Factors not found",
        e,
      });
    });
  response.status(200).send({
    message: "Travel Emission updated successfully",
  });
});

app.delete("/travelEmission", auth, async (request, response) => {
  await TravelEmission.deleteOne({ _id: request.body._id });
  response.status(200).send({
    message: "Travel Emission deleted successfully",
  });
});

app.get("/travelEmissions", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    console.log(companyId);
    await GSTravelEmission.deleteMany({ companyId: companyId });
    await GoogleSheets.findOne({ companyId: companyId })
      .then(async (result) => {
        const sheetsId = result.sheetsId;
        await travelEmissionfromSheets(
          "Travel!B5:F",
          "Road",
          sheetsId,
          companyId
        );
        // await travelEmissionfromSheets("Travel!G5:J", "Air", sheetsId, companyId);
      })
      .catch((e) => {});
    await new Promise((r) => setTimeout(r, 500));
    var travelEmissions = [];
    await TravelEmission.find({ companyId: companyId })
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

app.post("/cargoEmission", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    console.log(companyId);
    ClimatiqFactors.find({ category: "Cargo" })
      .then(async (climatiqFactors) => {
        var factors = {};
        climatiqFactors.forEach((factor) => {
          factors[factor.type] = factor;
        });
        const cargoEmission = new CargoEmission(request.body);
        cargoEmission.fromSheets = false;
        cargoEmission.companyId = companyId;
        await axios({
          method: "POST",
          url: "https://beta3.api.climatiq.io/estimate",
          data: JSON.stringify({
            emission_factor:
              factors[cargoEmission.travelBy]["factors"][
                cargoEmission.factorType
              ]["factor"],
            parameters: {
              distance: cargoEmission.distance,
              distance_unit: "km",
              weight: cargoEmission.weight,
              weight_unit: "kg",
            },
          }),
          headers: {
            Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
          },
        })
          .then(async function (res) {
            cargoEmission.calculation = res.data;
            // save the new emission
            var id = "";
            await cargoEmission.save().then((addedEmission) => {
              id = addedEmission._id;
            });
            response.status(201).send({
              message: "Cargo Emission added successfully",
              _id: id,
            });
          })
          .catch(function (error) {
            console.log(error);
          });
      })
      .catch((e) => {
        response.status(404).send({
          message: "Factors not found",
          e: e.message,
        });
      });
  });
});

app.put("/cargoEmission", auth, (request, response) => {
  ClimatiqFactors.find({ category: "Cargo" })
    .then(async (climatiqFactors) => {
      var factors = {};
      climatiqFactors.forEach((factor) => {
        factors[factor.type] = factor;
      });
      const cargoEmission = new CargoEmission(request.body);
      await axios({
        method: "POST",
        url: "https://beta3.api.climatiq.io/estimate",
        data: JSON.stringify({
          emission_factor:
            factors[cargoEmission.travelBy]["factors"][
              cargoEmission.factorType
            ]["factor"],
          parameters: {
            distance: cargoEmission.distance,
            distance_unit: "km",
            weight: cargoEmission.weight,
            weight_unit: "kg",
          },
        }),
        headers: {
          Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
        },
      })
        .then(async function (response) {
          cargoEmission.calculation = response.data;
          await CargoEmission.updateOne(
            { _id: cargoEmission._id },
            cargoEmission
          );
        })
        .catch(function (error) {
          console.log(error);
        });
    })
    .catch((e) => {
      response.status(404).send({
        message: "Factors not found",
        e,
      });
    });
  response.status(200).send({
    message: "Cargo Emission updated successfully",
  });
});

app.delete("/cargoEmission", auth, async (request, response) => {
  await CargoEmission.deleteOne({ _id: request.body._id });
  response.status(200).send({
    message: "Cargo Emission deleted successfully",
  });
});

app.get("/cargoEmissions", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    await GSCargoEmission.deleteMany({ companyId: companyId });
    await GoogleSheets.findOne({ companyId: companyId })
      .then(async (result) => {
        const sheetsId = result.sheetsId;
        await cargoEmissionfromSheets(
          "Cargo!B5:E",
          "Road",
          sheetsId,
          companyId
        );
        // await cargoEmissionfromSheets("Cargo!G5:J", "Air", sheetsId, companyId);
      })
      .catch((e) => {});
    await new Promise((r) => setTimeout(r, 500));
    var cargoEmissions = [];
    await CargoEmission.find({ companyId: companyId })
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

app.post("/electricityEmission", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    console.log(companyId);
    ClimatiqFactors.find({ category: "Electricity" })
      .then(async (climatiqFactors) => {
        var factors = {};
        climatiqFactors.forEach((factor) => {
          factors[factor.type] = factor;
        });
        const electricityEmission = new ElectricityEmission(request.body);
        electricityEmission.fromSheets = false;
        electricityEmission.companyId = companyId;
        await axios({
          method: "POST",
          url: "https://beta3.api.climatiq.io/estimate",
          data: JSON.stringify({
            emission_factor: {
              activity_id:
                factors["All"]["factors"][electricityEmission.factorType][
                  "factor"
                ],
            },
            parameters: {
              energy: electricityEmission.energy,
            },
          }),
          headers: {
            Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
          },
        })
          .then(async function (res) {
            electricityEmission.calculation = res.data;
            // save the new emission
            var id = "";
            await electricityEmission.save().then((addedEmission) => {
              id = addedEmission._id;
            });
            response.status(201).send({
              message: "Electricity Emission added successfully",
              _id: id,
            });
          })
          .catch(function (error) {
            console.log(error);
          });
      })
      .catch((e) => {
        response.status(404).send({
          message: "Factors not found",
          e: e.message,
        });
      });
  });
});

app.put("/electricityEmission", auth, (request, response) => {
  ClimatiqFactors.find({ category: "Electricity" })
    .then(async (climatiqFactors) => {
      var factors = {};
      climatiqFactors.forEach((factor) => {
        factors[factor.type] = factor;
      });
      const electricityEmission = new ElectricityEmission(request.body);
      await axios({
        method: "POST",
        url: "https://beta3.api.climatiq.io/estimate",
        data: JSON.stringify({
          emission_factor: {
            activity_id:
              factors["All"]["factors"][electricityEmission.factorType][
                "factor"
              ],
          },
          parameters: {
            energy: electricityEmission.energy,
          },
        }),
        headers: {
          Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
        },
      })
        .then(async function (response) {
          electricityEmission.calculation = response.data;
          await ElectricityEmission.updateOne(
            { _id: electricityEmission._id },
            electricityEmission
          );
        })
        .catch(function (error) {
          console.log(error);
        });
    })
    .catch((e) => {
      response.status(404).send({
        message: "Factors not found",
        e,
      });
    });
  response.status(200).send({
    message: "Electricity Emission updated successfully",
  });
});

app.delete("/electricityEmission", auth, async (request, response) => {
  await ElectricityEmission.deleteOne({ _id: request.body._id });
  response.status(200).send({
    message: "Electricity Emission deleted successfully",
  });
});

app.get("/electricityEmissions", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    await GSElectricityEmission.deleteMany({ companyId: companyId });
    await GoogleSheets.findOne({ companyId: companyId })
      .then(async (result) => {
        const sheetsId = result.sheetsId;
        await electricityEmissionfromSheets(
          "Electricity!B5:D",
          "All",
          sheetsId,
          companyId
        );
      })
      .catch((e) => {});
    await new Promise((r) => setTimeout(r, 500));
    var electricityEmissions = [];
    await ElectricityEmission.find({ companyId: companyId })
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

const productCarbonData = {
  "Maternity Bra": { companyAVG: 1.305869463, industryAVG: 1.37, weight: 0.5 },
  "Regular Bra": { companyAVG: 1.29938542, industryAVG: 1.37, weight: 0.5 },
  Panty: { companyAVG: 0.7263671483, industryAVG: 2.4, weight: 0.5 },
  "Lounge Long Tee Kind": {
    companyAVG: 2.777067598,
    industryAVG: 0,
    weight: 0.5,
  },
  "Lounge Dress Kind": { companyAVG: 5.987879838, industryAVG: 0, weight: 0.5 },
  Nighty: { companyAVG: 7.480894064, industryAVG: 0, weight: 0.5 },
  "Lounge Bottom": { companyAVG: 5.97522149, industryAVG: 0, weight: 0.5 },
};

app.post("/fuelEmission", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    console.log(companyId);
    ClimatiqFactors.find({ category: "Fuel" })
      .then(async (climatiqFactors) => {
        var factors = {};
        climatiqFactors.forEach((factor) => {
          factors[factor.type] = factor;
        });
        const fuelEmission = new FuelEmission(request.body);
        fuelEmission.fromSheets = false;
        fuelEmission.companyId = companyId;
        await axios({
          method: "POST",
          url: "https://beta3.api.climatiq.io/estimate",
          data: JSON.stringify({
            emission_factor: {
              activity_id:
                factors["All"]["factors"][fuelEmission.factorType]["factor"],
            },
            parameters: {
              volume: fuelEmission.volume,
              volume_unit: "l",
            },
          }),
          headers: {
            Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
          },
        })
          .then(async function (res) {
            fuelEmission.calculation = res.data;
            // save the new emission
            var id = "";
            await fuelEmission.save().then((addedEmission) => {
              id = addedEmission._id;
            });
            response.status(201).send({
              message: "Fuel Emission added successfully",
              _id: id,
            });
          })
          .catch(function (error) {
            console.log(error);
          });
      })
      .catch((e) => {
        response.status(404).send({
          message: "Factors not found",
          e: e.message,
        });
      });
  });
});

app.put("/fuelEmission", auth, (request, response) => {
  ClimatiqFactors.find({ category: "Fuel" })
    .then(async (climatiqFactors) => {
      var factors = {};
      climatiqFactors.forEach((factor) => {
        factors[factor.type] = factor;
      });
      const fuelEmission = new FuelEmission(request.body);
      await axios({
        method: "POST",
        url: "https://beta3.api.climatiq.io/estimate",
        data: JSON.stringify({
          emission_factor: {
            activity_id:
              factors["All"]["factors"][fuelEmission.factorType]["factor"],
          },
          parameters: {
            volume: fuelEmission.volume,
            volume_unit: "l",
          },
        }),
        headers: {
          Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
        },
      })
        .then(async function (response) {
          fuelEmission.calculation = response.data;
          await FuelEmission.updateOne({ _id: fuelEmission._id }, fuelEmission);
        })
        .catch(function (error) {
          console.log(error);
        });
    })
    .catch((e) => {
      response.status(404).send({
        message: "Factors not found",
        e,
      });
    });
  response.status(200).send({
    message: "Fuel Emission updated successfully",
  });
});

app.delete("/fuelEmission", auth, async (request, response) => {
  await FuelEmission.deleteOne({ _id: request.body._id });
  response.status(200).send({
    message: "Fuel Emission deleted successfully",
  });
});

app.get("/fuelEmissions", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    await GSFuelEmission.deleteMany({ companyId: companyId });
    await GoogleSheets.findOne({ companyId: companyId })
      .then(async (result) => {
        const sheetsId = result.sheetsId;
        await fuelEmissionfromSheets("Fuel!B5:D", "All", sheetsId, companyId);
      })
      .catch((e) => {});
    await new Promise((r) => setTimeout(r, 500));
    var fuelEmissions = [];
    await FuelEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const fuelEmission = FuelEmission(emission);
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

app.post("/productEmission", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    console.log(companyId);
    const productEmission = new ProductEmission(request.body);
    productEmission.fromSheets = false;
    productEmission.companyId = companyId;
    productEmission.calculation = {
      carbonEmitted:
        productEmission.numberOfItems *
        productCarbonData[productEmission.type]["companyAVG"],
      carbonSaved:
        productEmission.numberOfItems *
        (productCarbonData[productEmission.type]["industryAVG"] -
          productCarbonData[productEmission.type]["companyAVG"]),
    };
    var id = "";
    await productEmission.save().then((addedEmission) => {
      id = addedEmission._id;
    });
    response.status(201).send({
      message: "Product Emission added successfully",
      _id: id,
    });
  });
});

app.put("/productEmission", auth, async (request, response) => {
  const productEmission = new ProductEmission(request.body);
  productEmission.calculation = {
    carbonEmitted:
      productEmission.numberOfItems *
      productCarbonData[productEmission.type]["companyAVG"],
    carbonSaved:
      productEmission.numberOfItems *
      (productCarbonData[productEmission.type]["industryAVG"] -
        productCarbonData[productEmission.type]["companyAVG"]),
  };
  await ProductEmission.updateOne(
    { _id: productEmission._id },
    productEmission
  );
  response.status(200).send({
    message: "Product Emission updated successfully",
  });
});

app.delete("/productEmission", auth, async (request, response) => {
  await ProductEmission.deleteOne({ _id: request.body._id });
  response.status(200).send({
    message: "Product Emission deleted successfully",
  });
});

app.get("/productEmissions", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    await GSProductEmission.deleteMany({ companyId: companyId });
    await GoogleSheets.findOne({ companyId: companyId })
      .then(async (result) => {
        const sheetsId = result.sheetsId;
        await productEmissionfromSheets(
          "Product!B5:D",
          "All",
          sheetsId,
          companyId
        );
      })
      .catch((e) => {});
    await new Promise((r) => setTimeout(r, 500));
    var productEmissions = [];
    await ProductEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const productEmission = ProductEmission(emission);
          productEmissions.push(productEmission);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });
    await GSProductEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const productEmission = GSProductEmission(emission);
          productEmissions.push(productEmission);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });
    response.status(200).send(productEmissions);
  });
});

app.post("/buildingEmission", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    console.log(companyId);
    const buildingEmission = new BuildingEmission(request.body);
    buildingEmission.fromSheets = false;
    buildingEmission.companyId = companyId;
    buildingEmission.calculation =
      (buildingEmission.warehouseSpace + buildingEmission.buildingSpace) *
      ((280 / 365) * 13);
    var id = "";
    await buildingEmission.save().then((addedEmission) => {
      id = addedEmission._id;
    });
    response.status(201).send({
      message: "Building Emission added successfully",
      _id: id,
    });
  });
});

app.put("/buildingEmission", auth, async (request, response) => {
  const buildingEmission = new BuildingEmission(request.body);
  buildingEmission.calculation =
    (buildingEmission.warehouseSpace + buildingEmission.buildingSpace) *
    ((280 / 365) * 13);
  await BuildingEmission.updateOne(
    { _id: buildingEmission._id },
    buildingEmission
  );
  response.status(200).send({
    message: "Building Emission updated successfully",
  });
});

app.delete("/buildingEmission", auth, async (request, response) => {
  await BuildingEmission.deleteOne({ _id: request.body._id });
  response.status(200).send({
    message: "Building Emission deleted successfully",
  });
});

app.get("/buildingEmissions", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    await GSBuildingEmission.deleteMany({ companyId: companyId });
    await GoogleSheets.findOne({ companyId: companyId })
      .then(async (result) => {
        const sheetsId = result.sheetsId;
        await buildingEmissionfromSheets(
          "Building!B5:D",
          "All",
          sheetsId,
          companyId
        );
      })
      .catch((e) => {});
    await new Promise((r) => setTimeout(r, 500));
    var buildingEmissions = [];
    await BuildingEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const buildingEmission = BuildingEmission(emission);
          buildingEmissions.push(buildingEmission);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });
    await GSBuildingEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const buildingEmission = GSBuildingEmission(emission);
          buildingEmissions.push(buildingEmission);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });
    response.status(200).send(buildingEmissions);
  });
});

destinateCityDistance = {
  Jaipur: 653.5,
  Mumbai: 525.5,
  Ahmedabad: 0,
  Kolkata: 2078.2,
  Pune: 658.5,
  Hyderabad: 1187,
  Chennai: 1848.3,
  Bangalore: 1495.4,
};

app.get("/citiesList", auth, async (request, response) => {
  response.status(200).send({
    cities: Object.keys(destinateCityDistance),
  });
});

app.post("/deliveryEmission", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    console.log(companyId);
    ClimatiqFactors.find({ category: "Cargo" })
      .then(async (climatiqFactors) => {
        var factors = {};
        climatiqFactors.forEach((factor) => {
          factors[factor.type] = factor;
        });
        const deliveryEmission = new DeliveryEmission(request.body);
        deliveryEmission.fromSheets = false;
        deliveryEmission.companyId = companyId;
        await axios({
          method: "POST",
          url: "https://beta3.api.climatiq.io/estimate",
          data: JSON.stringify({
            emission_factor:
              factors[deliveryEmission.travelBy]["factors"][
                deliveryEmission.factorType
              ]["factor"],
            parameters: {
              distance: destinateCityDistance[deliveryEmission.destinationCity],
              distance_unit: "km",
              weight:
                productCarbonData[deliveryEmission.type]["weight"] *
                deliveryEmission.numberOfItems,
              weight_unit: "kg",
            },
          }),
          headers: {
            Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
          },
        })
          .then(async function (res) {
            deliveryEmission.calculation = res.data;
            // save the new emission
            var id = "";
            await deliveryEmission.save().then((addedEmission) => {
              id = addedEmission._id;
            });
            response.status(201).send({
              message: "Delivery Emission added successfully",
              _id: id,
            });
          })
          .catch(function (error) {
            console.log(error);
          });
      })
      .catch((e) => {
        response.status(404).send({
          message: "Factors not found",
          e: e.message,
        });
      });
  });
});

app.put("/deliveryEmission", auth, (request, response) => {
  ClimatiqFactors.find({ category: "Cargo" })
    .then(async (climatiqFactors) => {
      var factors = {};
      climatiqFactors.forEach((factor) => {
        factors[factor.type] = factor;
      });
      const deliveryEmission = new DeliveryEmission(request.body);
      await axios({
        method: "POST",
        url: "https://beta3.api.climatiq.io/estimate",
        data: JSON.stringify({
          emission_factor:
            factors[deliveryEmission.travelBy]["factors"][
              deliveryEmission.factorType
            ]["factor"],
          parameters: {
            distance: destinateCityDistance[deliveryEmission.destinationCity],
            distance_unit: "km",
            weight:
              productCarbonData[deliveryEmission.type]["weight"] *
              deliveryEmission.numberOfItems,
            weight_unit: "kg",
          },
        }),
        headers: {
          Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
        },
      })
        .then(async function (response) {
          deliveryEmission.calculation = response.data;
          await DeliveryEmission.updateOne(
            { _id: deliveryEmission._id },
            deliveryEmission
          );
        })
        .catch(function (error) {
          console.log(error);
        });
    })
    .catch((e) => {
      response.status(404).send({
        message: "Factors not found",
        e,
      });
    });
  response.status(200).send({
    message: "Delivery Emission updated successfully",
  });
});

app.delete("/deliveryEmission", auth, async (request, response) => {
  await DeliveryEmission.deleteOne({ _id: request.body._id });
  response.status(200).send({
    message: "Delivery Emission deleted successfully",
  });
});

app.get("/deliveryEmissions", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    await GSDeliveryEmission.deleteMany({ companyId: companyId });
    await GoogleSheets.findOne({ companyId: companyId })
      .then(async (result) => {
        const sheetsId = result.sheetsId;
        await deliveryEmissionfromSheets(
          "Delivery!B5:F",
          "Road",
          sheetsId,
          companyId
        );
        // await cargoEmissionfromSheets("Cargo!G5:J", "Air", sheetsId, companyId);
      })
      .catch((e) => {});
    await new Promise((r) => setTimeout(r, 500));
    var deliveryEmissions = [];
    await DeliveryEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const travelEmission = DeliveryEmission(emission);
          deliveryEmissions.push(travelEmission);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });
    await GSDeliveryEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const deliveryEmission = GSDeliveryEmission(emission);
          deliveryEmissions.push(deliveryEmission);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });
    response.status(200).send(deliveryEmissions);
  });
});

emissionTypes = {
  Travel: TravelEmission,
  GSTravel: GSTravelEmission,
  Cargo: CargoEmission,
  GSCargo: GSCargoEmission,
  Electricity: ElectricityEmission,
  GSElectricity: GSElectricityEmission,
  Fuel: FuelEmission,
  GSFuel: GSFuelEmission,
  Building: BuildingEmission,
  GSBuilding: GSBuildingEmission,
  Delivery: DeliveryEmission,
  GSDelivery: GSDeliveryEmission,
};

const taskNames = [
  "Travel",
  "Cargo",
  "Fuel",
  "Electricity",
  "Building",
  "Delivery",
];

app.post("/getTotal", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    let total = 0;
    await emissionTypes[request.body.emissionType]
      .find({ companyId: companyId })
      .then((emissions) => {
        emissions.forEach((emission) => {
          if (request.body.emissionType == "Building") {
            total += emission.calculation;
          } else {
            total += emission.calculation.co2e;
          }
        });
      });
    await emissionTypes["GS" + request.body.emissionType]
      .find({ companyId: companyId })
      .then((emissions) => {
        emissions.forEach((emission) => {
          if (request.body.emissionType == "Building") {
            total += emission.calculation;
          } else {
            total += emission.calculation.co2e;
          }
        });
      });
    response.status(200).send({ total: total });
  });
});

app.post("/task", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    console.log(companyId);
    const task = new TaskModel(request.body);
    task.companyId = companyId;
    var id = "";
    await task.save().then((addedTask) => {
      id = addedTask._id;
    });
    response.status(201).send({
      message: "Task added successfully",
      _id: id,
    });
  });
});

app.put("/task", auth, async (request, response) => {
  const task = new TaskModel(request.body);
  await TaskModel.updateOne({ _id: task._id }, task);
  response.status(200).send({
    message: "Task updated successfully",
  });
});

app.delete("/task", auth, async (request, response) => {
  await TaskModel.deleteOne({ _id: request.body._id });
  response.status(200).send({
    message: "Task deleted successfully",
  });
});

app.get("/task", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    var tasks = [];
    await TaskModel.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const task = TaskModel(emission);
          tasks.push(task);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });
    response.status(200).send(tasks);
  });
});

app.post("/taskData", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    var tasks = [];
    await TaskModel.find({
      companyId: companyId,
      emissionType: request.body.emissionType,
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const task = TaskModel(emission);
          tasks.push({
            goal: task.carbonSaveGoal,
            amountSpent: task.amount,
            emissionTillDate: task.emissionTillDate,
          });
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });
    response.status(200).send(tasks);
  });
});

app.get("/visualisation", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const travelResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const travelDistanceResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const employeeCommuteResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const businessCommuteResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const cargoResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const deliveryResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const deliveryDistanceResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const electricityResult = {
      Electricity: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const electricityUsageResult = {
      Electricity: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const fuelResult = {
      Fuel: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const buildingResult = {
      All: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const productCarbonEmissions = {
      "Maternity Bra": { emissions: 0, saved: 0, color: "#2085EC" },
      "Regular Bra": { emissions: 0, saved: 0, color: "#72B4EB" },
      Panty: { emissions: 0, saved: 0, color: "#8464A0" },
      "Lounge Long Tee Kind": { emissions: 0, saved: 0, color: "#0A417A" },
      "Lounge Dress Kind": { emissions: 0, saved: 0, color: "#CEA9BC" },
      Nighty: { emissions: 0, saved: 0, color: "#AC2195" },
      "Lounge Bottom": { emissions: 0, saved: 0, color: "#323232" },
    };
    const final = {
      // total: 0,
      // scope1: 0,
      // scope2: 0,
      // scope3: 0,
      // totalTravelEmission: 0,
      // totalCargoEmission: 0,
      // totalElectricityEmission: 0,
      // totalFuelEmission: 0,
      // totalElectricityUsage: 0,
      // totalDistanceTravelled: 0,
      // totalFuelExpenditure: 0,
    };
    var total = 0;
    var totalTravel = 0;
    var totalCargo = 0;
    var totalElectricity = 0;
    var totalBuilding = 0;
    var totalBuildingSpace = 0;
    var totalWarehouseSpace = 0;
    var totalProduct = 0;
    var totalFuel = 0;
    var totalElectricityUsage = 0;
    var totalDistanceTravelled = 0;
    var totalBusinessCommuteDistance = 0;
    var totalEmployeeCommuteDistance = 0;
    var totalFuelExpenditure = 0;
    var totalProductSaved = 0;

    await TravelEmission.find({
      companyId: companyId,
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          travelResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(emission.calculation.co2e);
          travelDistanceResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(emission.distance);
          total += parseFloat(emission.calculation.co2e);
          totalTravel += parseFloat(emission.calculation.co2e);
          totalDistanceTravelled += parseInt(emission.distance);
          if (emission.travelType === "Business") {
            businessCommuteResult[emission.travelBy][
              months[date.getMonth()]
            ] += parseFloat(emission.calculation.co2e);
            totalBusinessCommuteDistance += emission.distance;
          } else {
            employeeCommuteResult[emission.travelBy][
              months[date.getMonth()]
            ] += parseFloat(emission.calculation.co2e);
            totalEmployeeCommuteDistance += emission.distance;
          }
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    await GSTravelEmission.find({
      companyId: companyId,
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          travelResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(emission.calculation.co2e);
          travelDistanceResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(emission.distance);
          total += parseFloat(emission.calculation.co2e);
          totalTravel += parseFloat(emission.calculation.co2e);
          totalDistanceTravelled += parseInt(emission.distance);
          if (emission.travelType === "Business") {
            businessCommuteResult[emission.travelBy][
              months[date.getMonth()]
            ] += parseFloat(emission.calculation.co2e);
            totalBusinessCommuteDistance += emission.distance;
          } else {
            employeeCommuteResult[emission.travelBy][
              months[date.getMonth()]
            ] += parseFloat(emission.calculation.co2e);
            totalEmployeeCommuteDistance += emission.distance;
          }
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    final["totalTravelEmission"] = totalTravel;
    final["totalBusinessCommuteDistance"] = totalBusinessCommuteDistance;
    final["totalEmployeeCommuteDistance"] = totalEmployeeCommuteDistance;

    await CargoEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          cargoResult[emission.travelBy][months[date.getMonth()]] += parseFloat(
            emission.calculation.co2e
          );
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

    await GSCargoEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          cargoResult[emission.travelBy][months[date.getMonth()]] += parseFloat(
            emission.calculation.co2e
          );
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

    final["totalCargoEmission"] = totalCargo;
    final["totalDistanceTravelled"] = totalDistanceTravelled;

    await ElectricityEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          electricityResult["Electricity"][
            months[date.getMonth()]
          ] += parseFloat(emission.calculation.co2e);
          electricityUsageResult["Electricity"][
            months[date.getMonth()]
          ] += parseFloat(emission.energy);
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

    await GSElectricityEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          electricityResult["Electricity"][
            months[date.getMonth()]
          ] += parseFloat(emission.calculation.co2e);
          electricityUsageResult["Electricity"][
            months[date.getMonth()]
          ] += parseFloat(emission.energy);
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

    final["totalElectricityEmission"] = totalElectricity;
    final["totalElectricityUsage"] = totalElectricityUsage;

    await GSFuelEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          fuelResult["Fuel"][months[date.getMonth()]] += parseFloat(
            emission.calculation.co2e
          );
          total += parseFloat(emission.calculation.co2e);
          totalFuel += parseFloat(emission.calculation.co2e);
          totalFuelExpenditure += parseInt(emission.volume);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    await ProductEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          productCarbonEmissions[emission.type]["emissions"] +=
            emission.calculation.carbonEmitted;
          productCarbonEmissions[emission.type]["saved"] +=
            emission.calculation.carbonSaved;
          total += emission.calculation.carbonEmitted;
          totalProduct += emission.calculation.carbonEmitted;
          totalProductSaved += emission.calculation.carbonSaved;
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    await GSProductEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          productCarbonEmissions[emission.type]["emissions"] +=
            emission.calculation.carbonEmitted;
          productCarbonEmissions[emission.type]["saved"] +=
            emission.calculation.carbonSaved;
          total += emission.calculation.carbonEmitted;
          totalProduct += emission.calculation.carbonEmitted;
          totalProductSaved += emission.calculation.carbonSaved;
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    final["Product"] = productCarbonEmissions;
    final["TotalProductEmissions"] = totalProduct;
    final["TotalProductSaved"] = totalProductSaved;

    await BuildingEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          buildingResult["All"][months[date.getMonth()]] += parseFloat(
            emission.calculation
          );
          total += emission.calculation;
          totalBuilding += emission.calculation;
          totalBuildingSpace += emission.buildingSpace;
          totalWarehouseSpace += emission.warehouseSpace;
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    await GSBuildingEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          buildingResult["All"][months[date.getMonth()]] += parseFloat(
            emission.calculation
          );
          total += emission.calculation;
          totalBuilding += emission.calculation;
          totalBuildingSpace += emission.buildingSpace;
          totalWarehouseSpace += emission.warehouseSpace;
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    await DeliveryEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          deliveryResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(emission.calculation.co2e);
          deliveryDistanceResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(destinateCityDistance[emission.destinationCity]);
          total += parseFloat(emission.calculation.co2e);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    await GSDeliveryEmission.find({ companyId: companyId })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          deliveryResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(emission.calculation.co2e);
          deliveryDistanceResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(destinateCityDistance[emission.destinationCity]);
          total += parseFloat(emission.calculation.co2e);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    final["Building"] = buildingResult;
    final["TotalBuildingEmissions"] = totalBuilding;
    final["TotalBuildingSpace"] = totalBuildingSpace;
    final["TotalWarehouseSpace"] = totalWarehouseSpace;

    final["totalFuelEmission"] = totalFuel;
    final["totalFuelExpenditure"] = totalFuelExpenditure;

    final["total"] = total;
    final["scope1"] = totalProduct + totalBuilding;
    final["scope2"] = final["totalElectricityEmission"];
    final["scope3"] =
      final["totalTravelEmission"] + final["totalCargoEmission"];

    final["Travel"] = {};
    Object.keys(travelResult).forEach((key) => {
      final["Travel"][key] = [];
      Object.keys(travelResult[key]).forEach((month) => {
        final["Travel"][key].push({
          month: month,
          emission: travelResult[key][month],
        });
      });
    });
    final["TravelDistance"] = {};
    Object.keys(travelDistanceResult).forEach((key) => {
      final["TravelDistance"][key] = [];
      Object.keys(travelDistanceResult[key]).forEach((month) => {
        final["TravelDistance"][key].push({
          month: month,
          emission: travelDistanceResult[key][month],
        });
      });
    });

    final["Delivery"] = {};
    Object.keys(deliveryResult).forEach((key) => {
      final["Delivery"][key] = [];
      Object.keys(deliveryResult[key]).forEach((month) => {
        final["Delivery"][key].push({
          month: month,
          emission: deliveryResult[key][month],
        });
      });
    });
    final["DeliveryDistance"] = {};
    Object.keys(deliveryDistanceResult).forEach((key) => {
      final["DeliveryDistance"][key] = [];
      Object.keys(deliveryDistanceResult[key]).forEach((month) => {
        final["DeliveryDistance"][key].push({
          month: month,
          emission: deliveryDistanceResult[key][month],
        });
      });
    });

    final["BusinessCommuteEmissions"] = {};
    Object.keys(businessCommuteResult).forEach((key) => {
      final["BusinessCommuteEmissions"][key] = [];
      Object.keys(businessCommuteResult[key]).forEach((month) => {
        final["BusinessCommuteEmissions"][key].push({
          month: month,
          emission: businessCommuteResult[key][month],
        });
      });
    });
    final["EmployeeCommuteEmissions"] = {};
    Object.keys(employeeCommuteResult).forEach((key) => {
      final["EmployeeCommuteEmissions"][key] = [];
      Object.keys(employeeCommuteResult[key]).forEach((month) => {
        final["EmployeeCommuteEmissions"][key].push({
          month: month,
          emission: employeeCommuteResult[key][month],
        });
      });
    });

    final["Cargo"] = {};
    Object.keys(cargoResult).forEach((key) => {
      final["Cargo"][key] = [];
      Object.keys(cargoResult[key]).forEach((month) => {
        final["Cargo"][key].push({
          month: month,
          emission: cargoResult[key][month],
        });
      });
    });

    final["Electricity"] = {};
    Object.keys(electricityResult).forEach((key) => {
      final["Electricity"][key] = [];
      Object.keys(electricityResult[key]).forEach((month) => {
        final["Electricity"][key].push({
          month: month,
          emission: electricityResult[key][month],
        });
      });
    });
    final["ElectricityUsage"] = {};
    Object.keys(electricityUsageResult).forEach((key) => {
      final["ElectricityUsage"][key] = [];
      Object.keys(electricityUsageResult[key]).forEach((month) => {
        final["ElectricityUsage"][key].push({
          month: month,
          emission: electricityUsageResult[key][month],
        });
      });
    });

    final["Fuel"] = {};
    Object.keys(fuelResult).forEach((key) => {
      final["Fuel"][key] = [];
      Object.keys(fuelResult[key]).forEach((month) => {
        final["Fuel"][key].push({
          month: month,
          emission: fuelResult[key][month],
        });
      });
    });

    final["ProductGraph"] = [];
    Object.keys(productCarbonEmissions).forEach((key) => {
      final["ProductGraph"].push({
        name: key,
        saved: productCarbonEmissions[key]["emissions"],
        emission: productCarbonEmissions[key]["emissions"],
        color: productCarbonEmissions[key]["color"],
      });
    });
    response.status(200).send(final);
  });
});

app.get("/taskNames", auth, async (request, response) => {
  response.status(200).send({ taskNames: taskNames });
});

app.post("/summary", auth, async (request, response) => {
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    const companyId = user.companyId;
    const startDate = request.body.startDate;
    const endDate = request.body.endDate;
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const travelResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const travelDistanceResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const employeeCommuteResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const businessCommuteResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const cargoResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const deliveryResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const deliveryDistanceResult = {
      Road: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const electricityResult = {
      Electricity: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const electricityUsageResult = {
      Electricity: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const fuelResult = {
      Fuel: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const buildingResult = {
      All: {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      },
    };
    const productCarbonEmissions = {
      "Maternity Bra": { emissions: 0, saved: 0, color: "#2085EC" },
      "Regular Bra": { emissions: 0, saved: 0, color: "#72B4EB" },
      Panty: { emissions: 0, saved: 0, color: "#8464A0" },
      "Lounge Long Tee Kind": { emissions: 0, saved: 0, color: "#0A417A" },
      "Lounge Dress Kind": { emissions: 0, saved: 0, color: "#CEA9BC" },
      Nighty: { emissions: 0, saved: 0, color: "#AC2195" },
      "Lounge Bottom": { emissions: 0, saved: 0, color: "#323232" },
    };
    const final = { companyID: companyId };
    var total = 0;
    var totalTravel = 0;
    var totalCargo = 0;
    var totalElectricity = 0;
    var totalBuilding = 0;
    var totalBuildingSpace = 0;
    var totalWarehouseSpace = 0;
    var totalProduct = 0;
    var totalFuel = 0;
    var totalElectricityUsage = 0;
    var totalDistanceTravelled = 0;
    var totalBusinessCommuteDistance = 0;
    var totalEmployeeCommuteDistance = 0;
    var totalFuelExpenditure = 0;
    var totalProductSaved = 0;

    await TravelEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          travelResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(emission.calculation.co2e);
          travelDistanceResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(emission.distance);
          total += parseFloat(emission.calculation.co2e);
          totalTravel += parseFloat(emission.calculation.co2e);
          totalDistanceTravelled += parseInt(emission.distance);
          if (emission.travelType === "Business") {
            businessCommuteResult[emission.travelBy][
              months[date.getMonth()]
            ] += parseFloat(emission.calculation.co2e);
            totalBusinessCommuteDistance += emission.distance;
          } else {
            employeeCommuteResult[emission.travelBy][
              months[date.getMonth()]
            ] += parseFloat(emission.calculation.co2e);
            totalEmployeeCommuteDistance += emission.distance;
          }
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    await GSTravelEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          travelResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(emission.calculation.co2e);
          travelDistanceResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(emission.distance);
          total += parseFloat(emission.calculation.co2e);
          totalTravel += parseFloat(emission.calculation.co2e);
          totalDistanceTravelled += parseInt(emission.distance);
          if (emission.travelType === "Business") {
            businessCommuteResult[emission.travelBy][
              months[date.getMonth()]
            ] += parseFloat(emission.calculation.co2e);
            totalBusinessCommuteDistance += emission.distance;
          } else {
            employeeCommuteResult[emission.travelBy][
              months[date.getMonth()]
            ] += parseFloat(emission.calculation.co2e);
            totalEmployeeCommuteDistance += emission.distance;
          }
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    final["totalTravelEmission"] = totalTravel;
    final["totalBusinessCommuteDistance"] = totalBusinessCommuteDistance;
    final["totalEmployeeCommuteDistance"] = totalEmployeeCommuteDistance;

    await CargoEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          cargoResult[emission.travelBy][months[date.getMonth()]] += parseFloat(
            emission.calculation.co2e
          );
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

    await GSCargoEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          cargoResult[emission.travelBy][months[date.getMonth()]] += parseFloat(
            emission.calculation.co2e
          );
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

    final["totalCargoEmission"] = totalCargo;
    final["totalDistanceTravelled"] = totalDistanceTravelled;

    await ElectricityEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          electricityResult["Electricity"][
            months[date.getMonth()]
          ] += parseFloat(emission.calculation.co2e);
          electricityUsageResult["Electricity"][
            months[date.getMonth()]
          ] += parseFloat(emission.energy);
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

    await GSElectricityEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          electricityResult["Electricity"][
            months[date.getMonth()]
          ] += parseFloat(emission.calculation.co2e);
          electricityUsageResult["Electricity"][
            months[date.getMonth()]
          ] += parseFloat(emission.energy);
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

    final["totalElectricityEmission"] = totalElectricity;
    final["totalElectricityUsage"] = totalElectricityUsage;

    await GSFuelEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          fuelResult["Fuel"][months[date.getMonth()]] += parseFloat(
            emission.calculation.co2e
          );
          total += parseFloat(emission.calculation.co2e);
          totalFuel += parseFloat(emission.calculation.co2e);
          totalFuelExpenditure += parseInt(emission.volume);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    await ProductEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          productCarbonEmissions[emission.type]["emissions"] +=
            emission.calculation.carbonEmitted;
          productCarbonEmissions[emission.type]["saved"] +=
            emission.calculation.carbonSaved;
          total += emission.calculation.carbonEmitted;
          totalProduct += emission.calculation.carbonEmitted;
          totalProductSaved += emission.calculation.carbonSaved;
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    await GSProductEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          productCarbonEmissions[emission.type]["emissions"] +=
            emission.calculation.carbonEmitted;
          productCarbonEmissions[emission.type]["saved"] +=
            emission.calculation.carbonSaved;
          total += emission.calculation.carbonEmitted;
          totalProduct += emission.calculation.carbonEmitted;
          totalProductSaved += emission.calculation.carbonSaved;
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    final["Product"] = productCarbonEmissions;
    final["TotalProductEmissions"] = totalProduct;
    final["TotalProductSaved"] = totalProductSaved;

    await BuildingEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          buildingResult["All"][months[date.getMonth()]] += parseFloat(
            emission.calculation
          );
          total += emission.calculation;
          totalBuilding += emission.calculation;
          totalBuildingSpace += emission.buildingSpace;
          totalWarehouseSpace += emission.warehouseSpace;
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    await GSBuildingEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          buildingResult["All"][months[date.getMonth()]] += parseFloat(
            emission.calculation
          );
          total += emission.calculation;
          totalBuilding += emission.calculation;
          totalBuildingSpace += emission.buildingSpace;
          totalWarehouseSpace += emission.warehouseSpace;
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    await DeliveryEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          deliveryResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(emission.calculation.co2e);
          deliveryDistanceResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(destinateCityDistance[emission.destinationCity]);
          total += parseFloat(emission.calculation.co2e);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    await GSDeliveryEmission.find({
      companyId: companyId,
      date: { $gte: startDate, $lte: endDate },
    })
      // if travel emissions exists
      .then((emissions) => {
        emissions.forEach((emission) => {
          const date = new Date(emission.date);
          deliveryResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(emission.calculation.co2e);
          deliveryDistanceResult[emission.travelBy][
            months[date.getMonth()]
          ] += parseFloat(destinateCityDistance[emission.destinationCity]);
          total += parseFloat(emission.calculation.co2e);
        });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Data not found",
          e,
        });
      });

    final["Building"] = buildingResult;
    final["TotalBuildingEmissions"] = totalBuilding;
    final["TotalBuildingSpace"] = totalBuildingSpace;
    final["TotalWarehouseSpace"] = totalWarehouseSpace;

    final["totalFuelEmission"] = totalFuel;
    final["totalFuelExpenditure"] = totalFuelExpenditure;

    final["total"] = total;
    final["scope1"] = totalProduct + totalBuilding;
    final["scope2"] = final["totalElectricityEmission"];
    final["scope3"] =
      final["totalTravelEmission"] + final["totalCargoEmission"];

    final["Travel"] = {};
    Object.keys(travelResult).forEach((key) => {
      final["Travel"][key] = [];
      Object.keys(travelResult[key]).forEach((month) => {
        final["Travel"][key].push({
          month: month,
          emission: travelResult[key][month],
        });
      });
    });
    final["TravelDistance"] = {};
    Object.keys(travelDistanceResult).forEach((key) => {
      final["TravelDistance"][key] = [];
      Object.keys(travelDistanceResult[key]).forEach((month) => {
        final["TravelDistance"][key].push({
          month: month,
          emission: travelDistanceResult[key][month],
        });
      });
    });

    final["Delivery"] = {};
    Object.keys(deliveryResult).forEach((key) => {
      final["Delivery"][key] = [];
      Object.keys(deliveryResult[key]).forEach((month) => {
        final["Delivery"][key].push({
          month: month,
          emission: deliveryResult[key][month],
        });
      });
    });
    final["DeliveryDistance"] = {};
    Object.keys(deliveryDistanceResult).forEach((key) => {
      final["DeliveryDistance"][key] = [];
      Object.keys(deliveryDistanceResult[key]).forEach((month) => {
        final["DeliveryDistance"][key].push({
          month: month,
          emission: deliveryDistanceResult[key][month],
        });
      });
    });

    final["BusinessCommuteEmissions"] = {};
    Object.keys(businessCommuteResult).forEach((key) => {
      final["BusinessCommuteEmissions"][key] = [];
      Object.keys(businessCommuteResult[key]).forEach((month) => {
        final["BusinessCommuteEmissions"][key].push({
          month: month,
          emission: businessCommuteResult[key][month],
        });
      });
    });
    final["EmployeeCommuteEmissions"] = {};
    Object.keys(employeeCommuteResult).forEach((key) => {
      final["EmployeeCommuteEmissions"][key] = [];
      Object.keys(employeeCommuteResult[key]).forEach((month) => {
        final["EmployeeCommuteEmissions"][key].push({
          month: month,
          emission: employeeCommuteResult[key][month],
        });
      });
    });

    final["Cargo"] = {};
    Object.keys(cargoResult).forEach((key) => {
      final["Cargo"][key] = [];
      Object.keys(cargoResult[key]).forEach((month) => {
        final["Cargo"][key].push({
          month: month,
          emission: cargoResult[key][month],
        });
      });
    });

    final["Electricity"] = {};
    Object.keys(electricityResult).forEach((key) => {
      final["Electricity"][key] = [];
      Object.keys(electricityResult[key]).forEach((month) => {
        final["Electricity"][key].push({
          month: month,
          emission: electricityResult[key][month],
        });
      });
    });
    final["ElectricityUsage"] = {};
    Object.keys(electricityUsageResult).forEach((key) => {
      final["ElectricityUsage"][key] = [];
      Object.keys(electricityUsageResult[key]).forEach((month) => {
        final["ElectricityUsage"][key].push({
          month: month,
          emission: electricityUsageResult[key][month],
        });
      });
    });

    final["Fuel"] = {};
    Object.keys(fuelResult).forEach((key) => {
      final["Fuel"][key] = [];
      Object.keys(fuelResult[key]).forEach((month) => {
        final["Fuel"][key].push({
          month: month,
          emission: fuelResult[key][month],
        });
      });
    });

    final["ProductGraph"] = [];
    Object.keys(productCarbonEmissions).forEach((key) => {
      final["ProductGraph"].push({
        name: key,
        saved: productCarbonEmissions[key]["emissions"],
        emission: productCarbonEmissions[key]["emissions"],
        color: productCarbonEmissions[key]["color"],
      });
    });
    response.status(200).send(final);
  });
});

app.post("/googleSheets", auth, async (request, response) => {
  var sheetURL = request.body.sheetURL;
  let sheetsId = sheetURL.slice(39, 83);
  await User.findOne({ _id: request.user.userId }).then(async (user) => {
    GoogleSheets.findOne({ companyId: user.companyId })
      .then(async (sheets) => {
        sheets.sheetsId = sheetsId;
        await sheets.save();
      })
      .catch(async (e) => {
        const sheets = GoogleSheets({
          companyId: user.companyId,
          sheetsId: sheetsId,
        });
        await sheets.save();
      });
  });

  response.status(200).send({ Message: "Sheet Updated" });
});

async function travelEmissionfromSheets(range, type, id, companyId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credential.json",
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
        });
        allValues.forEach(async (value) => {
          var emissionDate = Date.parse(value[0]);
          const factorType = getFactorTypeFromName(
            factors,
            String(value[3]),
            type
          );
          const travelEmission = new GSTravelEmission({
            date: new Date(emissionDate),
            passengers: parseInt(value[1]),
            factorType: factorType,
            travelBy: type,
            travelType: value[4],
            distance: parseInt(value[2]),
            companyId: companyId,
          });
          await axios({
            method: "POST",
            url: "https://beta3.api.climatiq.io/estimate",
            data: JSON.stringify({
              emission_factor:
                factors[travelEmission.travelBy]["factors"][
                  travelEmission.factorType
                ]["factor"],
              parameters: {
                distance: travelEmission.distance,
                distance_unit: "km",
                passengers: travelEmission.passengers,
              },
            }),
            headers: {
              Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
            },
          })
            .then(async function (res) {
              travelEmission.calculation = res.data;
              await travelEmission.save().then((addedEmission) => {
                travelEmissions.push(addedEmission);
              });
            })
            .catch(function (error) {
              console.log(error);
            });
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
}

async function cargoEmissionfromSheets(range, type, id, companyId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credential.json",
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
        });
        allValues.forEach(async (value) => {
          var emissionDate = Date.parse(value[0]);
          const factorType = getFactorTypeFromName(
            factors,
            String(value[3]),
            type
          );
          const cargoEmission = new GSCargoEmission({
            date: new Date(emissionDate),
            weight: parseInt(value[1]),
            factorType: factorType,
            travelBy: type,
            distance: parseInt(value[2]),
            companyId: companyId,
          });
          await axios({
            method: "POST",
            url: "https://beta3.api.climatiq.io/estimate",
            data: JSON.stringify({
              emission_factor:
                factors[cargoEmission.travelBy]["factors"][
                  cargoEmission.factorType
                ]["factor"],
              parameters: {
                distance: cargoEmission.distance,
                distance_unit: "km",
                weight: cargoEmission.weight,
              },
            }),
            headers: {
              Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
            },
          })
            .then(async function (res) {
              cargoEmission.calculation = res.data;
              await cargoEmission.save();
            })
            .catch(function (error) {
              console.log(error);
            });
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
}

async function electricityEmissionfromSheets(range, type, id, companyId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credential.json",
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
        });
        allValues.forEach(async (value) => {
          var emissionDate = Date.parse(value[0]);
          const factorType = getFactorTypeFromName(
            factors,
            String(value[2]),
            type
          );
          const electricityEmission = new GSElectricityEmission({
            date: new Date(emissionDate),
            energy: parseInt(value[1]),
            factorType: factorType,
            companyId: companyId,
          });
          await axios({
            method: "POST",
            url: "https://beta3.api.climatiq.io/estimate",
            data: JSON.stringify({
              emission_factor: {
                activity_id:
                  factors[type]["factors"][electricityEmission.factorType][
                    "factor"
                  ],
              },
              parameters: {
                energy: electricityEmission.energy,
              },
            }),
            headers: {
              Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
            },
          })
            .then(async function (res) {
              electricityEmission.calculation = res.data;
              await electricityEmission.save();
            })
            .catch(function (error) {
              console.log(error);
            });
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
}

async function fuelEmissionfromSheets(range, type, id, companyId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credential.json",
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
        });
        allValues.forEach(async (value) => {
          var emissionDate = Date.parse(value[0]);
          const fuelEmission = new GSFuelEmission({
            date: new Date(emissionDate),
            volume: parseInt(value[1]),
            factorType: 1,
            companyId: companyId,
          });
          await axios({
            method: "POST",
            url: "https://beta3.api.climatiq.io/estimate",
            data: JSON.stringify({
              emission_factor: {
                activity_id:
                  factors[type]["factors"][fuelEmission.factorType]["factor"],
              },
              parameters: {
                volume: fuelEmission.volume,
                volume_unit: "l",
              },
            }),
            headers: {
              Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
            },
          })
            .then(async function (res) {
              fuelEmission.calculation = res.data;
              await fuelEmission.save();
            })
            .catch(function (error) {
              console.log(error);
            });
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
}

async function productEmissionfromSheets(range, type, id, companyId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credential.json",
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
    allValues.forEach(async (value) => {
      var emissionDate = Date.parse(value[0]);
      const productEmission = new GSProductEmission({
        date: new Date(emissionDate),
        numberOfItems: parseInt(value[1]),
        type: value[2],
        companyId: companyId,
      });
      productEmission.calculation = {
        carbonEmitted:
          productEmission.numberOfItems *
          productCarbonData[productEmission.type]["companyAVG"],
        carbonSaved:
          productEmission.numberOfItems *
          (productCarbonData[productEmission.type]["industryAVG"] -
            productCarbonData[productEmission.type]["companyAVG"]),
      };
      await productEmission.save();
    });
  }
}

async function buildingEmissionfromSheets(range, type, id, companyId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credential.json",
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
    allValues.forEach(async (value) => {
      var emissionDate = Date.parse(value[0]);
      const buildingEmission = new GSBuildingEmission({
        date: new Date(emissionDate),
        buildingSpace: parseInt(value[1]),
        warehouseSpace: parseInt(value[2]),
        companyId: companyId,
      });
      buildingEmission.calculation =
        (buildingEmission.warehouseSpace + buildingEmission.buildingSpace) *
        ((280 / 365) * 13);
      await buildingEmission.save();
    });
  }
}

async function deliveryEmissionfromSheets(range, type, id, companyId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credential.json",
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
        });
        allValues.forEach(async (value) => {
          var emissionDate = Date.parse(value[0]);
          const factorType = getFactorTypeFromName(
            factors,
            String(value[3]),
            type
          );
          const deliveryEmission = new GSDeliveryEmission({
            date: new Date(emissionDate),
            numberOfItems: parseInt(value[1]),
            factorType: factorType,
            travelBy: type,
            type: value[2],
            companyId: companyId,
            destinationCity: value[4],
          });
          await axios({
            method: "POST",
            url: "https://beta3.api.climatiq.io/estimate",
            data: JSON.stringify({
              emission_factor:
                factors[deliveryEmission.travelBy]["factors"][
                  deliveryEmission.factorType
                ]["factor"],
              parameters: {
                distance:
                  destinateCityDistance[deliveryEmission.destinationCity],
                distance_unit: "km",
                weight:
                  productCarbonData[deliveryEmission.type]["weight"] *
                  deliveryEmission.numberOfItems,
                weight_unit: "kg",
              },
            }),
            headers: {
              Authorization: "Bearer " + "TABXE4QS5FMMCENSPQJXWRYJ13XD",
            },
          })
            .then(async function (res) {
              deliveryEmission.calculation = res.data;
              await deliveryEmission.save();
            })
            .catch(function (error) {
              console.log(error);
            });
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }
}

function getFactorTypeFromName(factors, value, type) {
  // console.log(factors);
  // console.log(value);
  // console.log(type);
  const typeFactors = factors[type]["factors"];
  let finalKey = 0;
  Object.keys(typeFactors).forEach((key) => {
    if (
      String(
        typeFactors[key]["name"].toString().toLowerCase().replace(/\s+/g, "")
      ) === String(value.toString().toLowerCase().replace(/\s+/g, ""))
    ) {
      finalKey = parseInt(key);
    }
  });
  return finalKey;
}

module.exports = app;
