/**
 * To run this graph, you'll need an API key from Propublica.
 * Fetch an API Key from them for free (super easy): https://www.propublica.org/datastore/api/propublica-congress-api
 * and add it to your environment variables as PROPUBLICA_KEY
 */

const { gql } = require("graphql-tag");
const fetch = require("node-fetch");
const utils = require("../utils/utils");
const { createServerHandler } = require("../utils/server");
const { readFileSync } = require("fs");
const { resolve } = require("path");

const typeDefs = gql(
  readFileSync(resolve("api", "schemas", "congress.graphql"), {
    encoding: "utf-8",
  })
);
const headers = {
  // Get your API Key from ProPublica (free, super easy): https://www.propublica.org/datastore/api/propublica-congress-api.
  "X-API-Key": process.env.PROPUBLICA_KEY || "FAKE_KEY",
};

const resolvers = {
  Query: {
    congress: async (_, { session, chamber }) => {
      if (!session)
        throw new Error("Congress session must be specified, eg. 117");
      if (!chamber)
        throw new Error("Congress chamber must be specified, eg. SENATE");

      return await fetch(
        `https://api.propublica.org/congress/v1/${session}/${chamber.toLowerCase()}/members.json`,
        {
          headers,
        }
      )
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            return data.results.map((res) => utils.snakeToCamel(res));
          } else {
            throw new Error("Error fetching data. Did you include an API Key?");
          }
        })
        .catch((err) => new Error(err));
    },
    member: async (_, args) => {
      if (!args.id)
        throw new Error(
          "Must include an ID for a member of congress to fetch."
        );

      return await fetch(
        `https://api.propublica.org/congress/v1/members/${args.id}.json`,
        {
          headers,
        }
      )
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            return utils.snakeToCamel(data.results[0]);
          } else {
            throw new Error("Error fetching data. Did you include an API Key?");
          }
        })
        .catch((err) => new Error(err));
    },
  },
  CongressSession: {
    member: ({ members }, { id, firstAndLastName }) => {
      if (!id && !firstAndLastName) {
        throw new Error(
          "Must provide either an id or a firstAndLastName input to member"
        );
      } else if (!!id && !!firstAndLastName) {
        throw new Error("Provide either an id or a firstAndLastName, not both");
      } else if (!!id) {
        const member = members.find((m) => m.id === id);
        if (member) {
          return member;
        } else {
          throw new Error(
            "Did not find any congress members with that id in this congress session"
          );
        }
      } else {
        const member = members.find(
          (m) => `${m.firstName} ${m.lastName}` === firstAndLastName
        );
        if (member) {
          return member;
        } else {
          throw new Error(
            "Did not find any congress members with that firstAndLastName in this congress session"
          );
        }
      }
    },
  },
  MemberVote: {
    vote: async (parent) => {
      if (!parent.voteUri)
        throw new Error("Cannot fetch vote without MemberVote.voteUri");

      return await fetch(parent.voteUri, {
        headers,
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            return utils.snakeToCamel(data.results.votes.vote);
          } else {
            throw new Error("Error fetching data. Did you include an API Key?");
          }
        })
        .catch((err) => new Error(err));
    },
  },
  MemberGeneralDetails: {
    votes: async (parent, args) => {
      if (!parent.id)
        throw new Error(
          "Cannot fetch member vote data if Member.id is not requested."
        );

      return await fetch(
        `https://api.propublica.org/congress/v1/members/${parent.id}/votes.json?offset=${args.offset}`,
        {
          headers,
        }
      )
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            return data.results[0].votes.map((res) => utils.snakeToCamel(res));
          } else {
            throw new Error("Error fetching data. Did you include an API Key?");
          }
        })
        .catch((err) => new Error(err));
    },
  },
  Bill: {
    details: async (parent, args) => {
      if (!parent.apiUri)
        throw new Error(
          "Cannot fetch member vote data if Member.id is not requested."
        );

      return await fetch(parent.apiUri, {
        headers,
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            console.log(data);
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
