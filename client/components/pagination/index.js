import React from 'react';
import ReactDOM from "react-dom";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import PaginationPeopleApp from './PaginationPeopleApp';

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// Default cursor pagination is fine for traditional clientside pagination
// because the cursors are just indexes.

// This example shows a non cached i.e. refetch each time and cached example.

const client = new ApolloClient({
    uri: "http://localhost:8000/graphql",
    cache: new InMemoryCache({
        typePolicies: {
            ViewerNode: {
                fields: {
                    peoplePages: {
                        keyArgs: false,
                        merge(existing, incoming, o) {
                            // replace the cache with the new
                            // i.e. do not cache
                            return incoming;
                        },
                    }
                }
            }
        }
    })
});

ReactDOM.render(
    <ApolloProvider client={client}>
        <PaginationPeopleApp />
    </ApolloProvider>,
    document.getElementById('root')
);