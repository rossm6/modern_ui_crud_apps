import React, { useState } from "react";
import { useLazyQuery, gql } from "@apollo/client";
import Table from "./Table";

const LOAD_PRODUCTS = gql`
  query LoadProducts ($first: Int, $after: String, $pageSize: Int, $orderBy: String, $formData: ProductNodeInput) {
    viewer {
      id
      products (first: $first, after: $after, orderBy: $orderBy, formData: $formData) {
        edges {
          node {
            square {
                id
                pk
            }
            startUi
            durationUi
            endUi
            listing
            price
          }
          cursor
        }
        pages (pageSize: $pageSize) {
          first {
            cursor
            pageNumber
            isCurrent
          }
          last {
            cursor
            pageNumber
            isCurrent
          }
          around {
            cursor
            pageNumber
            isCurrent
          }
          previous {
            cursor
            pageNumber
            isCurrent
          }
        }
        total
      }
    }
  }
`;

const App = () => {

    const [getData, { loading, data }] = useLazyQuery(LOAD_PRODUCTS, { fetchPolicy: 'cache-first' });
    // I noticed that getData calls are rendering the Table multiple times... not sure if this is correct or not
    // At least we don't have multiple network calls
    // View discussion here of similar behavior - https://github.com/trojanowski/react-apollo-hooks/issues/36

    const columns = [
        { label: "Square", dataKey: "square" },
        { label: "Price", dataKey: "price" },
    ];

    const getProducts = (queryData) => {
        return queryData?.viewer.products.edges.map(e => {
            let o = {...e.node};
            o.square = o.square.pk;
            return o;
        });
    };

    return (
        <Table
            loading={loading}
            fetchData={getData}
            data={getProducts(data)}
            columns={columns}
            orderBy={[
                { "col": 0, "dir": "asc", order: 0 }
            ]}
        />
    )

};

export default App;