import React from 'react';
import ReactDOM from "react-dom";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import BasicPeopleApp from './BasicPeopleApp';

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

const client = new ApolloClient({
    uri: "http://localhost:8000/graphql",
    cache: new InMemoryCache()
  });

ReactDOM.render(
    <ApolloProvider client={client}>
      <BasicPeopleApp />
    </ApolloProvider>,
    document.getElementById('root')
  );