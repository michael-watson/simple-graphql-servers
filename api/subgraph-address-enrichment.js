const { gql } = require("graphql-tag");
const fetch = require("node-fetch");
const utils = require("../utils/utils");
const { createServerHandler } = require("../utils/server");
const { readFileSync } = require("fs");
const { resolve } = require("path");

const typeDefs = gql(
  readFileSync(resolve("api", "schemas", "address-enrichment.graphql"), {
    encoding: "utf-8",
  })
);

const resolvers = {
  Query: {
    address: async (_, { streetAddress }, { position_stack_key }) => {
      return await fetch(
        `http://api.positionstack.com/v1/forward?access_key=${position_stack_key}&query=${encodeURI(
          streetAddress
        )}`
      )
        .then(async (res) => {
          if (res.ok) {
            const response = await res.json();
            return utils.snakeToCamel(response.data[0]);
          } else {
            throw new Error("Error fetching data. Did you include an API Key?");
          }
        })
        .catch((err) => new Error(err));
    },
  },
  MemberSessionDetails: {
    __resolveReference: async ({ office }) => {
      return await fetch(
        `http://api.positionstack.com/v1/forward?access_key=${
          process.env.POSITION_STACK_KEY
        }&query=${encodeURI(office)}`
      )
        .then(async (res) => {
          if (res.ok) {
            const response = await res.json();
            return {
              office,
              location: utils.snakeToCamel(response.data[0]),
            };
          } else {
            throw new Error("Error fetching data. Did you include an API Key?");
          }
        })
        .catch((err) => new Error(err));
    },
  },
  Location: {
    __resolveReference: async ({ latitude, longitude }) => {
      return await fetch(
        `http://api.positionstack.com/v1/reverse?access_key=${process.env.POSITION_STACK_KEY}&query=${latitude},${longitude}`
      )
        .then(async (res) => {
          if (res.ok) {
            const response = await res.json();
            return utils.snakeToCamel(response.data[0]);
          } else {
            throw new Error("Error fetching data. Did you include an API Key?");
          }
        })
        .catch((err) => new Error(err));
    },
  },
};

const getHandler = (event, context) => {
  const graphqlHandler = createServerHandler(typeDefs, resolvers);
  if (!event.requestContext) {
    event.requestContext = context;
  }
  return graphqlHandler(event, context);
};

exports.handler = getHandler;
