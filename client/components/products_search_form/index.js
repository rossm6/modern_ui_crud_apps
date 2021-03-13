import React from 'react';
import ReactDOM from "react-dom";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import ProductSearchForm from "./App"

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(
    <ProductSearchForm/>,
    document.getElementById('root')
);