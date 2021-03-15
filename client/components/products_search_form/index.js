import React from 'react';
import ReactDOM from "react-dom";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import ProductSearchForm from "./App";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(
    <Container>
        <Row>
            <Col md={4}>
                <ProductSearchForm/>
            </Col>
        </Row>
    </Container>,
    document.getElementById('root')
);