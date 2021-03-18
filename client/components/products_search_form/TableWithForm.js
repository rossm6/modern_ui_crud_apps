import React, { useRef } from 'react';
import { gql, useQuery } from "@apollo/client";
import styled from 'styled-components';
import ProductSearchForm from "./Form";
import Table from "./Table";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export const LOAD_PRODUCTS = gql`
  query LoadProducts ($first: Int, $after: String, $pageSize: Int, $orderBy: String) {
    viewer {
      id
      products (first: $first, after: $after, orderBy: $orderBy) {
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

const Styles = styled.div`
    table {
        border: 1px solid #ccc;
        border-collapse: collapse;
        margin: 0;
        padding: 0;
        width: 100%;
        table-layout: fixed;
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

function TableApp() {
    const pageSize = useRef(10);

    const { loading,
        data,
        fetchMore, }
        = useQuery(LOAD_PRODUCTS, {
            variables: {
                first: pageSize.current,
                after: ''
            },
            fetchPolicy: 'cache-first'
            // fetchPolicy: 'no-cache' causes the original query
            // to fire after every new query
            // as well as being stupid this ruins the table because the original result only shows
            // Possible bug to replicate
            // I noticed later that 'network-only' was doing the same thing although this didn't result
            // in the second query, the original, rendering the UI with the data from the server.
            // So this is a bug and then given this bug another it seems lol
            // Issue - https://github.com/apollographql/apollo-client/issues/6313
            // fetchPolicy: 'cache-first' will check the cache first but will always hit the server because
            // the cache is always cleaned out to contain only the latest page as per the merge function
            // defined in the typePolicy
        });

    const columns = React.useMemo(
        () => [
            {
                Header: 'Square',
                accessor: 'col1',
            },
            {
                Header: 'Start',
                accessor: 'col2'
            },
            {
                Header: 'Duration',
                accessor: 'col3'
            },
            {
                Header: 'End',
                accessor: 'col4'
            },
            {
                Header: 'Listing',
                accessor: 'col5'
            },
            {
                Header: 'Price',
                accessor: 'col6'
            }
        ]
    );

    const from_field_to_column = {
        'start': 'startUi',
        'duration': 'durationUi',
        'end': 'endUi',
    };

    const orm_ordering = {
        'col1': 'square_id',
        'col2': 'start',
        'col3': 'duration',
        'col4': 'end',
        'col5': 'listing',
        'col6': 'price'
    };

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

    const getOrderingQuery = (sortBy) => {
        const ordering = [];
        sortBy.forEach((s, i) => {
            const dir = s.desc ? '-' : '';
            ordering.push(`${dir}${orm_ordering[s.id]}`);
        });
        return ordering;
    };

    const getCursorFromOffset = (offset) => {
        if (offset == 0) return "";
        return encodeCursor(offset);
    };

    const fetchData = React.useCallback(({ pageSize: _pageSize, pageIndex, sortBy, searchText }) => {
        pageSize.current = _pageSize;
        const orderBy = getOrderingQuery(sortBy);
        const offset = pageIndex ? pageIndex * _pageSize - 1 : 0;
        fetchMore({
            variables: {
                first: _pageSize,
                after: getCursorFromOffset(offset),
                orderBy: orderBy.join(','),
                searchText: searchText
            }
        })
        // fetchMore still using same original variables -
        // https://github.com/apollographql/apollo-client/issues/2499
    }, []);

    const getTableData = (data) => {
        const col_order = ["square", "start", "duration", "end", "listing", "price"];
        const table_data = [];
        data?.viewer.products.edges.forEach((edge, i) => {
            const o = {};
            col_order.forEach((key, i) => {
                o[`col${i + 1}`] = edge.node[from_field_to_column[key] || key];
                if (key == "square") {
                    o[`col${i + 1}`] = edge.node[key]["pk"];
                }
            });
            table_data.push(o);
        });
        return table_data;
    };

    const getTotal = () => {
        let total = data?.viewer.products.total;
        return 0 || total;
    };

    const getPageCount = (data) => {
        const total = getTotal(data);
        if (!total) return 0;
        return total > pageSize.current ? Math.floor(total / pageSize.current) : 1;
    };

    return (
        <Container fluid="md">
            <Row>
                <Col>
                    <ProductSearchForm />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Styles>
                        <Table
                            columns={columns}
                            data={getTableData(data)}
                            fetchData={fetchData}
                            loading={loading}
                            total={getTotal(data)}
                            pageCount={getPageCount(data)}
                        />
                    </Styles>
                </Col>
            </Row>
        </Container>
    );
}

export default TableApp;
