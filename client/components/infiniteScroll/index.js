import React from "react";
import ReactDOM from "react-dom";
import InfiniteScroll from "./infiniteScroll";
import { ApolloProvider, ApolloClient, InMemoryCache, gql } from "@apollo/client";

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

const client = new ApolloClient({
    uri: "http://localhost:8000/graphql",
    cache: new InMemoryCache({
        typePolicies: {
            ViewerNode: {
                fields: {
                    squares: {
                        keyArgs: false,
                        merge(existing, incoming) {
                            incoming.pages
                        },
                    }
                }
            }
        }
    })
});

const SQUARES_LIST_QUERY = gql`
  query LOAD_SQUARES(){
    viewer {
      id
      squares {
        edges {
          node {
            pk
          }
          cursor
        }
        pages {
          first {
            isCurrent
          }
        }
      }
    }
  }
`;

ReactDOM.render(
    <ApolloProvider client={client}>
        <InfiniteScroll query={SQUARES_LIST_QUERY}>
            <SquaresList />
        </InfiniteScroll>
    </ApolloProvider>,
    document.getElementById('root')
);