import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { App } from './App';

const client = new ApolloClient({
  uri: process.env.NODE_ENV === 'production' ? 'https://main--congress2.apollographos.net/graphql' : 'http://localhost:4000',
  cache: new InMemoryCache()
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
