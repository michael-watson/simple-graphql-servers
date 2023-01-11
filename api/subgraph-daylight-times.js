const { gql } = require('graphql-tag');
const fetch = require('node-fetch');
const utils = require('../utils/utils');
const { createServerHandler } = require('../utils/server');
const { readFileSync } = require('fs');
const { resolve } = require('path');

const typeDefs = gql(
  readFileSync(resolve("api", "schemas", "daylight-times.graphql"), {
    encoding: "utf-8",
  })
);
const resolvers = {
  Location: {
    __resolveReference: async ({ latitude, longitude }) => {
      return await fetch(
        `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`
      )
        .then(async (res) => {
          if (res.ok) {
            const response = await res.json();
            return {
              latitude,
              longitude,
              ...utils.snakeToCamel(response.results)
            };
          } else {
            throw new Error('Error fetching data. Did you include an API Key?');
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