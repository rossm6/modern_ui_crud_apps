import React from 'react';
import ReactDOM from "react-dom";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

const client = new ApolloClient({
    uri: "http://localhost:8000/graphql",
    cache: new InMemoryCache()
});


const Table = () => {

    var data = [
        { "square": 1, "start": "1 Apr 2021", "duration": "1 day", "end": "2 Apr 2021", "listing": "lease", "price": "100.50" },
        { "square": 2, "start": "2 Apr 2021", "duration": "1 day", "end": "3 Apr 2021", "listing": "sale", "price": "113.50" }
    ];

    return (
        <table class="table">
            <thead>
                <tr>
                    <th>Square</th>
                    <th>Listing</th>
                    <th>Start</th>
                    <th>Duration</th>
                    <th>End</th>
                    <th>Price</th>
                </tr>
            </thead>
            <tbody>
                {data.map((row) => (
                    <tr>
                        <td data-label="square">{row.square}</td>
                        <td data-label="listing">{row.listing}</td>
                        <td data-label="start">{row.start}</td>
                        <td data-label="duration">{row.duration}</td>
                        <td data-label="end">{row.end}</td>
                        <td data-label="price">{row.price}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
};

ReactDOM.render(
    <Table />,
    document.getElementById('root')
);