import React, { useState, useEffect, useRef } from 'react';
import { useTable, useSortBy, usePagination } from "react-table";
import { gql, useQuery } from "@apollo/client";
import Pagination from "react-bootstrap/Pagination";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

// page size is fixed at 5 to begin with

export const LOAD_PRODUCTS = gql`
  query LoadProducts ($first: Int, $after: String, $pageSize: Int, $orderBy: String, $searchText: String) {
    viewer {
      id
      products (first: $first, after: $after, orderBy: $orderBy, searchText: $searchText) {
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


function Table({
    columns,
    data,
    onSort,
    fetchData,
    loading,
    pageCount: controlledPageCount,
    total
}) {
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        page,
        canPreviousPage,
        canNextPage,
        pageOptions,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize, sortBy }
    } = useTable(
        {
            columns,
            data,
            manualPagination: true,
            manualSortBy: true,
            autoResetPage: false,
            autoResetSortBy: false,
            pageCount: controlledPageCount
        },
        useSortBy,
        usePagination
    );
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        if (!loading) {
            fetchData({ pageIndex, pageSize, sortBy, searchText });
        }
    }, [sortBy, fetchData, pageIndex, pageSize, searchText]);

    const getPageButtons = (currentPageIndex, lastPageIndex, gotoPage) => {
        let pageIndexes = [];
        pageIndexes.push(0);
        const around = [-2, -1, 0, 1, 2];
        around.forEach((m, i) => {
            const pageIndex = currentPageIndex + m;
            if (pageIndex >= 0 && pageIndex <= lastPageIndex) {
                pageIndexes.push(pageIndex);
            }
        });
        if (lastPageIndex > 0) {
            pageIndexes.push(lastPageIndex);
        }
        // remove duplicate indexes
        const uniquePageIndexes = [...new Set(pageIndexes)];
        const onClickHandler = (pageIndex, currentIndex) => {
            const isCurrent = pageIndex == currentIndex;
            return () => {
                return !isCurrent && gotoPage(pageIndex)
            };
        };
        uniquePageIndexes.sort((a, b) => a - b);
        console.log(uniquePageIndexes);
        if (uniquePageIndexes.length > 3) {
            // -1 has special meaning - will create an ellipsis button
            uniquePageIndexes.splice(1, 0, -1);
            uniquePageIndexes.splice(uniquePageIndexes.length - 1, 0, -1);
        }
        const buttons = [];
        uniquePageIndexes.forEach((pageIndex, index) => {
            let b;
            if (pageIndex == -1) {
                b = <Pagination.Ellipsis key={index} />;
            }
            else {
                b = <Pagination.Item key={index} active={pageIndex == currentPageIndex} onClick={onClickHandler(pageIndex, currentPageIndex)}>{pageIndex + 1}</Pagination.Item>;
            }
            buttons.push(b);
        });
        return buttons;
    };

    const searchSquares = (text) => {
        setSearchText(text);
    };

    // alert("ALERT - " + controlledPageCount);

    return (
        <>
            <div className="my-2">
                <div className="d-flex justify-content-between">
                    <div>
                        <Form.Control className="w-auto" as="select" custom
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                            }}>
                            {[10, 20, 30, 40, 50].map((pageSize) => (
                                <option key={pageSize} value={pageSize}>
                                    Show {pageSize}
                                </option>
                            ))}
                        </Form.Control>
                    </div>
                    <div>
                        <Form.Control onChange={(e) => searchSquares(e.target.value)} type="text" placeholder="Search Squares ..." />
                    </div>
                </div>

            </div>
            <table {...getTableProps()} className="table">
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                // Add the sorting props to control sorting. For this example
                                // we can add them into the header props
                                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                    {column.render("Header")}
                                    {/* Add a sort direction indicator */}
                                    <span>
                                        {column.isSorted
                                            ? column.isSortedDesc
                                                ? " 🔽"
                                                : " 🔼"
                                            : ""}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {page.map((row, i) => {
                        prepareRow(row);
                        return (
                            <tr {...row.getRowProps()}>
                                {row.cells.map((cell) => {
                                    return (
                                        <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    {loading && <tr><td colSpan="10000">Loading...</td></tr>}
                    {!total && <tr><td className="text-center" colSpan="10000">Nothing found...</td></tr>}
                </tbody>
            </table>
            <div className="row">
                <div className="col">
                    <span>Showing {page.length} of {total}{" "} results</span>
                </div>
                <div className="col">
                    {controlledPageCount ? <Pagination className="justify-content-end">
                        <Pagination.First onClick={() => gotoPage(0)} disabled={!canPreviousPage} />
                        <Pagination.Prev onClick={() => previousPage()} disabled={!canPreviousPage} />
                        {getPageButtons(pageIndex, controlledPageCount - 1, gotoPage)}
                        <Pagination.Next onClick={() => nextPage()} disabled={!canNextPage} />
                        <Pagination.Last onClick={() => gotoPage(controlledPageCount - 1)} disabled={!canNextPage} />
                    </Pagination> : null}
                </div>
            </div>
        </>
    );
}

function App() {
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
        <Table
            columns={columns}
            data={getTableData(data)}
            fetchData={fetchData}
            loading={loading}
            total={getTotal(data)}
            pageCount={getPageCount(data)}
        />
    );
}

export default App;