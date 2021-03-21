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
            read(existing, { readField, cache }) {
              console.log("cache", cache);
              if (!existing) return;
              let edges = [];
              let existingEdges = existing.edges.slice(0);
              existingEdges.sort((edge1, edge2) => {
                const pk1 = readField("pk", edge1.node);
                const pk2 = readField("pk", edge2.node);
                return +pk1 - +pk2;
              }); // CRUCIAL ORDERED BY ASC PK
              const firstNodePk = readField("pk", existingEdges[0].node);
              if (+firstNodePk != 1) {
                return; // nothing to show
              }
              edges.push(existingEdges[0])
              // We don't have to worry which endCursor is found below
              // because partial updates are not possible.  So
              // end cursor must be a legitimate end cursor
              // i.e. the last index of a page
              // remember data set here being infinitely scrolled is a fixed data set
              for (var i = 1; i < existingEdges.length; i++) {
                let node1 = existingEdges[i-1].node;
                let node2 = existingEdges[i].node;
                let pk1 = readField('pk', node1);
                let pk2 = readField('pk', node2);
                if (+pk1 + 1 == +pk2) {
                  edges.push(existingEdges[i]);
                }
                else {
                  break;
                }
              }
              let pageInfo = {
                endCursor: edges[edges.length - 1].cursor,
                hasPreviousPage: false,
                hasNextPage: true,
                startCursor: "",
                "__typename": "PageInfo"
              };
              let oo = {
                edges,
                pageInfo
              }
              const edgesWithNodes = [];
              oo.edges.forEach((edge) => {
                const pk = readField('pk', edge.node);
                const id = readField('id', edge.node);
                const actualNode = {
                  "__typename": "SquareNode",
                  pk,
                  id
                };
                const newEdge = {
                  "__typename": "SquareNodeEdge",
                  cursor: edge.cursor,
                  node: actualNode
                };
                edgesWithNodes.push(newEdge);
              });
              oo.edges = edgesWithNodes;
              // we need to replace the node refs with the real fields p
              return oo;
            }
          },
        }
      }
    }
  })
});


ReactDOM.render(
  <ApolloProvider client={client}>
    <InfiniteScroll pageSize={25} query={SQUARES_LIST_QUERY}>
      <SquaresList />
    </InfiniteScroll>
  </ApolloProvider>,
  document.getElementById('root')
);