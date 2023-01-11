const { ApolloServer } = require("@apollo/server");
const {
  startServerAndCreateLambdaHandler,
} = require("@as-integrations/aws-lambda");
const { buildSubgraphSchema } = require("@apollo/subgraph");
const {
  ApolloServerPluginUsageReporting,
} = require("@apollo/server/plugin/usageReporting");
const {
  ApolloServerPluginInlineTrace,
} = require("@apollo/server/plugin/inlineTrace");
const {
  ApolloServerPluginLandingPageLocalDefault,
} = require("@apollo/server/plugin/landingPage/default");

const createServerHandler = (typeDefs, resolvers) => {
  const server = new ApolloServer({
    introspection: true,
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    plugins: [
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      ApolloServerPluginInlineTrace(),
      ...(process.env.NODE_ENV === "production"
        ? [ApolloServerPluginUsageReporting()]
        : []),
    ],
  });

  return startServerAndCreateLambdaHandler(server, {
    context: ({event}) => {
      return { ipinfo: event.headers['ip_info_key'],position_stack_key: event.headers['position_stack_key'] };
    },
  });
};

exports.createServerHandler = createServerHandler;
