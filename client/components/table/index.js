import React from "react";
import ReactDOM from "react-dom";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import App from "./App";

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

const client = new ApolloClient({
    uri: "http://localhost:8000/graphql",
    cache: new InMemoryCache({
        typePolicies: {
            ViewerNode: {
                fields: {
                    products: {
                        keyArgs: false,
                        merge(existing, incoming) {
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
        <App/>
    </ApolloProvider>,
    document.getElementById('root')
);