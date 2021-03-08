import React from 'react';
import ReactDOM from "react-dom";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import LoadMorePeopleApp from './LoadMorePeopleApp';

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

function default_people() {
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

const loadMorePagination = () => {
    return {
        keyArgs: false,
        merge(existing = default_people(), incoming, o) {
            console.log("merge");
            console.log(existing);
            console.log(incoming);
            console.log("end merge");
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
    }
};

const client = new ApolloClient({
    uri: "http://localhost:8000/graphql",
    cache: new InMemoryCache({
        typePolicies: {
            ViewerNode: {
                fields: {
                    people: loadMorePagination()
                }
            }
        }
    })
});

ReactDOM.render(
    <ApolloProvider client={client}>
        <LoadMorePeopleApp/>
    </ApolloProvider>,
    document.getElementById('root')
);