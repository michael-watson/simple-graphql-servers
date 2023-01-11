const { readFileSync } = require("fs");
const { gql } = require("graphql-tag");
const fetch = require("node-fetch");
const { resolve } = require("path");
const utils = require("../utils/utils");
const { createServerHandler } = require("../utils/server");

const typeDefs = gql(
  readFileSync(resolve("api", "schemas", "ip-enrichment.graphql"), {
    encoding: "utf-8",
  })
);

const resolvers = {
  Query: {
    giveError: (_, { message }) => {
      throw new Error(message || "Hello! This is the error you requested.");
    },
    ipLocation: async (_, { ip }, { ipinfo }) => {
      return await fetch(`https://ipinfo.io/${encodeURI(ip)}?token=${ipinfo}`)
        .then(async (res) => {
          if (res.ok) {
            const response = await res.json();
            const [latitude, longitude] = response.loc.split(",");
            return utils.snakeToCamel({
              latitude,
              longitude,
              ...response,
            });
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
