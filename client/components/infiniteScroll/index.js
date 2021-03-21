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
          read(existing) {
            if (!existing) return;
            let edges = [];
            let existingEdges = existing.edges.slice(0);
            existingEdges.sort((a, b) => a.node.pk - b.node.pk); // CRUCIAL ORDERED BY ASC PK
            if (existingEdges.length) {
              if (+existingEdges[0].node.pk != 1) {
                return; // nothing to show
              }
              edges.push(existingEdges[0])
            }
            // We don't have to worry which endCursor is found below
            // because partial updates are not possible.  So
            // end cursor must be a legitimate end cursor
            // i.e. the last index of a page
            // remember data set here being infinitely scrolled is a fixed data set
            for (var i = 1; i < existingEdges.length; i++) {
              if (+existingEdges[i].pk == +existingEdges[i + 1].pk) {
                edges.push(existingEdges[i]);
              }
              else {
                break;
              }
            }
            let pageInfo = {
              endCursor: edges[edges.length - 1].cursor
            };
            return {
              edges,
              pageInfo
            }
          }
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
    <InfiniteScroll pageSize={25} query={SQUARES_LIST_QUERY}>
      <SquaresList />
    </InfiniteScroll>
  </ApolloProvider>,
  document.getElementById('root')
);