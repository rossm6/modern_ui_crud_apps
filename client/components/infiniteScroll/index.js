import React from "react";
import ReactDOM from "react-dom";
import InfiniteScroll from "./infiniteScroll";
import { ApolloProvider, ApolloClient, InMemoryCache, gql } from "@apollo/client";
import SquaresList from "./SquaresList";

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';


function default_squares() {
  return {
    pageInfo: {
      hasPreviousPage: false,
      hasNextPage: false,
      startCursor: "",
      endCursor: ""
    },
    edges: []
  }
}


const client = new ApolloClient({
  uri: "http://localhost:8000/graphql",
  cache: new InMemoryCache({
    typePolicies: {
      ViewerNode: {
        fields: {
          squares: {
            keyArgs: false,
            merge(existing = default_squares(), incoming) {
              // a naive merge i.e. we assume incoming is always the real
              // next page
              if (!incoming) {
                return existing;
              }
              const newPageInfo = {
                ...incoming.pageInfo,
                startCursor: existing.pageInfo.startCursor
              };
              return {
                pageInfo: newPageInfo,
                edges: [
                  ...existing.edges,
                  ...incoming.edges
                ]
              }
            },
          },
        }
      }
    }
  })
});

const SQUARES_LIST_QUERY = gql`
  query LOAD_SQUARES ($first: Int, $after: String) {
    viewer {
      id
      squares(first: $first, after: $after) {
        edges {
          node {
            pk
            id
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
`;

ReactDOM.render(
  <ApolloProvider client={client}>
    <InfiniteScroll pageSize={5} query={SQUARES_LIST_QUERY}>
      <SquaresList />
    </InfiniteScroll>
  </ApolloProvider>,
  document.getElementById('root')
);