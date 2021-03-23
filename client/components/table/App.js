import React, { useRef, useState, useEffect } from "react";
import { useLazyQuery, gql } from "@apollo/client";
import Table from "./Table";
import { Container, Row, Col } from "react-bootstrap";
import ProductSearchForm from "./Form";
import styled from 'styled-components';

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
        formErrors {
          field
          errors
        }
      }
    }
  }
`;

const Styles = styled.div`

    div.table_wrapper {
      min-height: 800px;
      height: 800px;
      max-height: 800px;
      overflow-y: scroll;
    }

    table {
        border: 1px solid #ccc;
        border-collapse: collapse;
        margin: 0;
        padding: 0;
        width: 100%;
        table-layout: fixed;
        min-height: 800px;
    }

    table caption {
        font-size: 1.5em;
        margin: .5em 0 .75em;
    }

    table tr {
        border: 1px solid #ddd;
        padding: .35em;
    }

    table th,
    table td {
        padding: .625em;
        text-align: center;
    }

    table th {
        font-size: .85em;
        letter-spacing: .1em;
        text-transform: uppercase;
    }

    @media screen and (max-width: 575px) {
        table {
            border: 0;
        }

        table thead tr {
            border: none;
        }

        table th {
            border: none;
            padding: 0;
            margin-top: 2px;
        }

        th span.th-span {
            background-color: #007bff;
            color: white;
            display: block;
            border-radius: 5px;
            padding: 3px;
            color: white;
        }

        table th {
            display: block;
        }

        table caption {
            font-size: 1.3em;
        }

        table tr {
            display: block;
            margin-bottom: .625em;
        }

        table td {
            border-top: none;
            border-bottom: 1px solid #ddd;
            display: block;
            font-size: .8em;
            text-align: right;
        }

        table td::before {
            /*
            * aria-label has no advantage, it won't be read inside a table
            content: attr(aria-label);
            */
            content: attr(data-label);
            float: left;
            font-weight: bold;
            text-transform: uppercase;
        }

        table td:last-child {
            border-bottom: 0;
        }
    }
`;

const App = () => {
  const [fetchInitialData, { loading, data, fetchMore, called }] = useLazyQuery(LOAD_PRODUCTS, { fetchPolicy: 'no-cache' });
  // I noticed that getData calls are rendering the Table multiple times... not sure if this is correct or not
  // At least we don't have multiple network calls
  // View discussion here of similar behavior - https://github.com/trojanowski/react-apollo-hooks/issues/36

  // this has to be memo because useCallbacks in the Table Component depend
  // on this array.  Without the same ref guranteed we'd just has the callback firing all the time
  // which in turn would result in infinite loops.

  const columns = React.useMemo(
    () => {
      return [
        { label: "Square", dataKey: "square", orderKey: "square_id" },
        { label: "Start", dataKey: "startUi", orderKey: "start" },
        { label: "Duration", dataKey: "durationUi" },
        { label: "End", dataKey: "endUi" },
        { label: "Listing", dataKey: "listing" },
        { label: "Price", dataKey: "price" },
      ]
    },
    []
  )

  const getProducts = (queryData) => {
    return queryData?.viewer.products.edges.map(e => {
      let o = { ...e.node };
      o.square = o.square.pk;
      return o;
    });
  };

  const getTotalPages = (queryData) => {
    return queryData?.viewer.products.pages?.last.pageNumber || 0;
  };

  const _getData = ({ pageSize, pageIndex, orderBy, formData }) => {

    const encodeCursor = (offset) => {
      // server implementation is -
      // def encode_cursor(index):
      // return b64encode(
      //     index.encode('utf8')
      // ).decode('ascii')
      // this is the JS equivalent
      const prefix = 'arrayconnection:'; // this is the prefix used by the graphene relay package on the server
      let cursor = prefix + offset;
      return decodeURI(btoa(encodeURI(cursor)));
    };

    const getCursorFromOffset = (offset) => {
      if (offset == 0) return "";
      return encodeCursor(offset);
    };

    const getOrderingQuery = (orderBy) => {
      // orderBy = [{field: "square", dir: "desc"}]
      const ordering = [];
      orderBy.forEach((o) => {
        const dir = o.dir == "desc" ? '-' : '';
        ordering.push(`${dir}${o.field}`);
      });
      return ordering.join(',')
    };

    const orderByAsStr = getOrderingQuery(orderBy);
    const offset = pageIndex ? pageIndex * pageSize - 1 : 0;
    const cursor = getCursorFromOffset(offset);

    let variables = {
      first: pageSize,
      after: cursor,
      orderBy: orderByAsStr,
      pageSize,
    }

    if (formData) {
      variables = {
        ...variables,
        formData
      };
    }

    if (!called) {
      fetchInitialData({ variables })
    }
    else {
      fetchMore({
        variables: {
          first: pageSize,
          after: cursor,
          orderBy: orderByAsStr,
          pageSize,
        }
      });
    }
  };

  const getData = useRef((o) => { return _getData(o); });

  /*
    orderBy specifies at least the columns which can be ordered
    by the user.  Dir and order cannot be set without the other,
    though together they are optional.
  
    I.e.

    Without dir and order -

      Name which columns can be ordered

    With dir and order -

      Name which columns can be ordered
      AND
      State the ordering direction and order of
      precedence

    Three dir states are possible for a col -

      asc
      desc
      null
      
  */

  const getTotalCount = (queryData) => {
    return queryData?.viewer.products.total;
  };

  const getFormErrors = (queryData) => {
    console.log("form errors data", queryData);
    return queryData?.viewer.products.formErrors;
  };

  const scrollTopRef = useRef({ scrollTop: 0 });

  return (

    <Styles>
      <Container ref={scrollTopRef} onScroll={(e) => {
        scrollTopRef.current.scrollTop = e.target.scrollTop;
      }}>
        <div className="table_wrapper p-2">
          <Table
            loading={loading}
            fetchData={getData.current}
            data={getProducts(data)}
            columns={columns}
            orderBy={[
              { "col": 0, "dir": "asc", order: 0 },
              { "col": 5, "dir": "asc", order: 1 },
            ]}
            usePagination={true}
            totalPages={getTotalPages(data)}
            totalCount={getTotalCount(data)}
            form={ProductSearchForm}
            formErrors={getFormErrors(data)}
          />
        </div>
      </Container>
    </Styles>
  )

};

export default App;