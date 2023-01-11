const { readFileSync } = require('fs');
const { gql } = require('graphql-tag');
const fetch = require('node-fetch');
const { resolve } = require('path');
const { createServerHandler } = require('../utils/server');

const typeDefs = gql(
  readFileSync(resolve("api", "schemas", "weather.graphql"), {
    encoding: "utf-8",
  })
);

const resolvers = {
  Location: {
    __resolveReference: async ({ latitude, longitude }) => {
      return await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&APPID=f07ae920c19fb5d89d65c0ca5d235b1f`
      )
        .then(async (res) => {
          if (res.ok) {
            const response = await res.json();
            return {
              latitude,
              longitude,
              weather: response.weather[0]
                ? response.weather[0].description
                : undefined,
              temperature: response.main.temp,
              feelsLike: response.main.feels_like,
              tempMin: response.main.temp_min,
              tempMax: response.main.temp_max,
              pressure: response.main.pressure,
              humidity: response.main.humidity,
              windSpeed: response.wind.speed
            };
            // return utils.snakeToCamel(response.results);
          } else {
            throw new Error('Error fetching data');
          }
        })
        .catch((err) => new Error(err));
    }
  }
};

const getHandler = (event, context) => {
  const graphqlHandler = createServerHandler(typeDefs, resolvers);
  if (!event.requestContext) {
    event.requestContext = context;
  }
  return graphqlHandler(event, context);
};

exports.handler = getHandler;