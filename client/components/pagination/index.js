import React from 'react';
import ReactDOM from "react-dom";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import LoadMorePeopleApp from './LoadMorePeopleApp';

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// Default cursor pagination is fine for traditional clientside pagination
// because the cursors are just indexes.

// function default_people() {
//     return {
//         pageInfo: {
//             hasPreviousPage: false,
//             hasNextPage: false,
//             startCursor: "",
//             endCursor: ""
//         },
//         edges: []
//     }
// }

// const loadMorePagination = () => {
//     return {
//         keyArgs: false,
//         merge(existing = default_people(), incoming, o) {
//             console.log("merge");
//             console.log(existing);
//             console.log(incoming);
//             console.log("end merge");
//             if (!incoming) {
//                 return existing;
//             }
//             const newPageInfo = {
//                 ...incoming.pageInfo,
//                 startCursor: existing.pageInfo.startCursor
//             };
//             return {
//                 pageInfo: newPageInfo,
//                 edges: [
//                     ...existing.edges,
//                     ...incoming.edges
//                 ]
//             }
//         },
//     }
// };

const client = new ApolloClient({
    uri: "http://localhost:8000/graphql",
    cache: new InMemoryCache()
});

ReactDOM.render(
    <ApolloProvider client={client}>
        <PaginationPeopleApp/>
    </ApolloProvider>,
    document.getElementById('root')
);